import { getRows } from "./xlsx";
import { getLexingResult, FormulaParser } from "./compiler";
import { parseExressions } from "./rpnbuilder";
import { IToken, CstNode, ILexingError, IRecognitionException, CstElement } from "chevrotain";
import { getConnection, insert, closeConnection, test as testDB } from "./dbinsterter";

const prompt = require("prompt-sync")({ sigint: true });
const fs = require("fs");

var rows = getRows(10);

var parsedFormula = parseRow(process.argv[2] || "255");
var row = rows.find((row) => row.id == process.argv[2]);
createFiles(parsedFormula);
var table = convertToTable(parsedFormula);
async function pushToTable() {
    var connection = await getConnection();
    table.forEach(async (row) => {
        var result = await insert(connection, row);
        if (result) {
            console.log('Rows Inserted: ', result);
        }
    })
    //@ts-ignore
    connection.commit();
    //@ts-ignore
    closeConnection(connection)

}

async function test() {
    var connection = await getConnection();
    const result = await testDB(connection);
    //@ts-ignore
    console.log(result.rows ? result.rows : "error")
}

pushToTable();

function runTest() {
    rows.forEach((row, index) => {
        var lexingResult = getLexingResult(row.text);

        if (lexingResult.errors.length > 0) {
            console.log(`${row.id}@${index}\n${row.text}`);
            lexingResult.tokens.forEach(
                (token: {
                    startOffset: any;
                    image: string;
                    tokenType: { name: string };
                }) => {
                    console.log({
                        image: token.image,
                        type: token.tokenType.name,
                        offset: token.startOffset,
                    });
                }
            );
            console.log(lexingResult.errors);
        }
        var parser = new FormulaParser();
        parser.input = lexingResult.tokens;
        let cst = parser.Program();
        if (parser.errors.length > 0) {
            console.log(parser.errors);
            console.log(parser.errors[0].context.ruleStack);
            console.log(parser.errors[0].context.ruleOccurrenceStack);
            console.log(row.text);
            console.log(row.id);
            prompt("Pres Enter To Continue");
        } else {
            //console.log(JSON.stringify(cst, null, 2));
        }
    });
}

function countErrors() {
    var errors = 0;
    rows.forEach((row, index) => {
        var lexingResult = getLexingResult(row.text);
        /* lexingResult.tokens.forEach((token: { image: string; tokenType: { name: string; }; }) => {
                console.log({ image: token.image, type: token.tokenType.name })
            }) */
        if (lexingResult.errors.length > 0) {
            console.log(`${row.id}@${index}\n${row.text}`);
            lexingResult.tokens.forEach(
                (token: {
                    startOffset: any;
                    image: string;
                    tokenType: { name: string };
                }) => {
                    console.log({
                        image: token.image,
                        type: token.tokenType.name,
                        offset: token.startOffset,
                    });
                }
            );
            console.log(lexingResult.errors);
        }
        var parser = new FormulaParser();
        parser.input = lexingResult.tokens;
        let cst = parser.Program();
        if (parser.errors.length > 0) {
            console.log({
                errorsCount: ++errors,
                index: index,
                id: row.id,
            });
            /* console.log(parser.errors);
                  console.log(parser.errors[0].context.ruleStack);
                  console.log(parser.errors[0].context.ruleOccurrenceStack);
                  console.log(row.text); */
        } else {
            var resultSTR: string = JSON.stringify(cst, null, 2);
            console.log(resultSTR);
        }
    });
}

interface ParsingResult {
    formula: {
        id: string,
        text: string
    }
    tokens: IToken[],
    cst: CstNode | null,
    statements: any | null,
    errors?: ILexingError[] | IRecognitionException[] | null;
};

function parseRow(id: string): ParsingResult {
    var row = rows.find((row) => row.id == id);
    var lexingResult = getLexingResult(row.text);
    if (lexingResult.errors.length > 0) {
        var res: ParsingResult = {
            formula: {
                id: row.id,
                text: row.text
            },
            tokens: lexingResult.tokens,
            cst: null,
            statements: null,
            errors: lexingResult.errors
        }
        return res;
    }
    var parser = new FormulaParser();
    lexingResult.tokens;
    parser.input = lexingResult.tokens;
    let cst = parser.Program();
    if (parser.errors.length > 0) {
        var res: ParsingResult = {
            formula: {
                id: row.id,
                text: row.text
            },
            tokens: lexingResult.tokens,
            cst: cst,
            statements: null,
            errors: parser.errors
        }
        return res;
    }
    var statements = parseExressions(cst, row.text);
    var res: ParsingResult = {
        formula: {
            id: row.id,
            text: row.text
        },
        tokens: lexingResult.tokens,
        cst: cst,
        statements: statements,
        errors: null
    }
    return res;
}

interface CreateFilesOptions {
    tokens: boolean,
    statements: boolean,
    cst: boolean
}

function createFiles(parsingResult: ParsingResult, options?: CreateFilesOptions): void {
    var resultSTR: string = JSON.stringify(parsingResult.cst, null, 2);
    const fileCST = `${process.cwd()}/data//out/${parsingResult.formula.id}.json`;
    if (!options || options.cst) {
        fs.writeFileSync(fileCST, resultSTR, { encoding: "utf-8" });
    }
    resultSTR = JSON.stringify(parsingResult.tokens, null, 2);
    const fileTable = `${process.cwd()}/data//out/${parsingResult.formula.id}.table.json`;
    const fileStatements = `${process.cwd()}/data//out/${parsingResult.formula.id}.statements.json`;
    if (!options || options.tokens) {
        fs.writeFileSync(fileTable, resultSTR, { encoding: "utf-8" });
    }
    if (!options || options.statements) {
        resultSTR = JSON.stringify(parsingResult.statements, null, 2);
        fs.writeFileSync(fileStatements, resultSTR, { encoding: "utf-8" });
    }
}

interface FormulaTableRow {
    IDF: string,
    TOKENNAMEGROUP: string,
    N: string,
    TOKENTYPE: string,
    IMAGE: string,
    DIMENSIONSPECIFIER: string
}


function convertToTable(parsingResult: ParsingResult): FormulaTableRow[] {
    class FormulaTableRowGenerator {
        IDF: string;
        N: number;
        constructor(idf: string) {
            this.IDF = idf;
            this.N = 0;
        }
        row(tokenNameGroup: string, tokenType: string, image: string, dimensionSpecifier?: string): FormulaTableRow {
            var newRow = <FormulaTableRow>{};

            newRow.IDF = this.IDF;
            newRow.N = (this.N++).toString();
            /* Automatically fills these two fields*/

            newRow.TOKENNAMEGROUP = tokenNameGroup;
            newRow.IMAGE = image;
            newRow.TOKENTYPE = tokenType;
            newRow.DIMENSIONSPECIFIER = dimensionSpecifier ? dimensionSpecifier : "";
            return newRow;
        }
    }
    var rows: FormulaTableRow[] = [];
    var generator = new FormulaTableRowGenerator(parsingResult.formula.id);

    if (!parsingResult.cst) {
        return rows;
    }

    // pushing rows of varible declarations
    var variablesTable: string[] = [];
    (parsingResult.cst.children.VariableDeclaration as CstNode[]).forEach(declarationEntry => {
        declarationEntry.children.Identifier.forEach(identifier => {
            var image = (identifier as IToken).image;
            variablesTable.push(image);
            rows.push(generator.row('variabledeclaration', 'Identifier', image));
        })
    });
    // adding rows of source, dimensions declaration, assing statements.
    (parsingResult.cst.children.SourceBlock as CstNode[]).forEach((sourceBlock, SBIndex) => {
        // adding source deсlaration
        var SourceDeclaration = (sourceBlock.children.SourceDeclaration[0] as CstNode)
        var sourceName = (SourceDeclaration.children.Identifier[0] as IToken).image;
        rows.push(generator.row('sourceDeclaration', 'SourceName', sourceName));

        //adding dimensions
        var dimensions = (sourceBlock.children.Dimensions[0] as CstNode).children.DimensionDeclaration;
        dimensions.forEach(dimension => {
            var image = ((dimension as CstNode).children.Identifier[0] as IToken).image;
            var specifier = ((dimension as CstNode).children.DimensionSpecifier[0] as CstNode)
            if (specifier.location && specifier.location.endOffset) {
                var specifierStr = parsingResult.formula.text.slice(specifier.location.startOffset, specifier.location.endOffset + 1)
                rows.push(generator.row('dimensionDeclaration', 'DimensionName', image, specifierStr))
            }
        })

        // adding asssign statements 
        sourceBlock.children.AssignStatement.forEach((statement, statementIndex) => {
            var variableImage = ((statement as CstNode).children.Identifier[0] as IToken).image;
            rows.push(generator.row('assignStatement', 'VariableName', variableImage));
            (statement as CstNode).children.parsingResult.forEach((_el, index) => {
                var el = _el as any;
                var tokenType = 'Error';
                if (el.str && el.tokenType) {
                    if (el.tokenType === 'Identifier') {
                        tokenType = variablesTable.includes(el.str) ? 'VariableName' : 'Mnemonic';
                    } else {
                        tokenType = el.tokenType;
                    }
                }
                rows.push(generator.row('expression', tokenType, el.str))
            })
            rows.push(generator.row('assignStatement', "Equal", '='));
        })

        // adding return statement
        if (parsingResult.cst) {
            var returnStatement = (parsingResult.cst.children.ReturnStatement[0] as CstNode).children;
            // !TODO: check if in variableTable
            rows.push(generator.row('returnStatement', 'VariableName', (returnStatement.Identifier[0] as IToken).image));
            rows.push(generator.row('returnStatement', 'Return', (returnStatement.Return[0] as IToken).image));
        }
    });


    return rows;
}

export { FormulaTableRow } 
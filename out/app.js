"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const xlsx_1 = require("./xlsx");
const compiler_1 = require("./compiler");
const rpnbuilder_1 = require("./rpnbuilder");
const dbinsterter_1 = require("./dbinsterter");
const prompt = require("prompt-sync")({ sigint: true });
const fs = require("fs");
var rows = (0, xlsx_1.getRows)(10);
var parsedFormula = parseRow(process.argv[2] || "255");
var row = rows.find((row) => row.id == process.argv[2]);
createFiles(parsedFormula);
var table = convertToTable(parsedFormula);
function pushToTable() {
    return __awaiter(this, void 0, void 0, function* () {
        var connection = yield (0, dbinsterter_1.getConnection)();
        table.forEach((row) => __awaiter(this, void 0, void 0, function* () {
            var result = yield (0, dbinsterter_1.insert)(connection, row);
            if (result) {
                console.log('Rows Inserted: ', result);
            }
        }));
        //@ts-ignore
        connection.commit();
        //@ts-ignore
        (0, dbinsterter_1.closeConnection)(connection);
    });
}
function test() {
    return __awaiter(this, void 0, void 0, function* () {
        var connection = yield (0, dbinsterter_1.getConnection)();
        const result = yield (0, dbinsterter_1.test)(connection);
        //@ts-ignore
        console.log(result.rows ? result.rows : "error");
    });
}
console.log(table);
function runTest() {
    rows.forEach((row, index) => {
        var lexingResult = (0, compiler_1.getLexingResult)(row.text);
        if (lexingResult.errors.length > 0) {
            console.log(`${row.id}@${index}\n${row.text}`);
            lexingResult.tokens.forEach((token) => {
                console.log({
                    image: token.image,
                    type: token.tokenType.name,
                    offset: token.startOffset,
                });
            });
            console.log(lexingResult.errors);
        }
        var parser = new compiler_1.FormulaParser();
        parser.input = lexingResult.tokens;
        let cst = parser.Program();
        if (parser.errors.length > 0) {
            console.log(parser.errors);
            console.log(parser.errors[0].context.ruleStack);
            console.log(parser.errors[0].context.ruleOccurrenceStack);
            console.log(row.text);
            console.log(row.id);
            prompt("Pres Enter To Continue");
        }
        else {
            //console.log(JSON.stringify(cst, null, 2));
        }
    });
}
function countErrors() {
    var errors = 0;
    rows.forEach((row, index) => {
        var lexingResult = (0, compiler_1.getLexingResult)(row.text);
        /* lexingResult.tokens.forEach((token: { image: string; tokenType: { name: string; }; }) => {
                console.log({ image: token.image, type: token.tokenType.name })
            }) */
        if (lexingResult.errors.length > 0) {
            console.log(`${row.id}@${index}\n${row.text}`);
            lexingResult.tokens.forEach((token) => {
                console.log({
                    image: token.image,
                    type: token.tokenType.name,
                    offset: token.startOffset,
                });
            });
            console.log(lexingResult.errors);
        }
        var parser = new compiler_1.FormulaParser();
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
        }
        else {
            var resultSTR = JSON.stringify(cst, null, 2);
            console.log(resultSTR);
        }
    });
}
;
function parseRow(id) {
    var row = rows.find((row) => row.id == id);
    var lexingResult = (0, compiler_1.getLexingResult)(row.text);
    if (lexingResult.errors.length > 0) {
        var res = {
            formula: {
                id: row.id,
                text: row.text
            },
            tokens: lexingResult.tokens,
            cst: null,
            statements: null,
            errors: lexingResult.errors
        };
        return res;
    }
    var parser = new compiler_1.FormulaParser();
    lexingResult.tokens;
    parser.input = lexingResult.tokens;
    let cst = parser.Program();
    if (parser.errors.length > 0) {
        var res = {
            formula: {
                id: row.id,
                text: row.text
            },
            tokens: lexingResult.tokens,
            cst: cst,
            statements: null,
            errors: parser.errors
        };
        return res;
    }
    var statements = (0, rpnbuilder_1.parseExressions)(cst, row.text);
    var res = {
        formula: {
            id: row.id,
            text: row.text
        },
        tokens: lexingResult.tokens,
        cst: cst,
        statements: statements,
        errors: null
    };
    return res;
}
function createFiles(parsingResult, options) {
    var resultSTR = JSON.stringify(parsingResult.cst, null, 2);
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
function convertToTable(parsingResult) {
    class FormulaTableRowGenerator {
        constructor(idf) {
            this.IDF = idf;
            this.N = 0;
        }
        row(tokenNameGroup, tokenType, image, dimensionSpecifier) {
            var newRow = {};
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
    var rows = [];
    var generator = new FormulaTableRowGenerator(parsingResult.formula.id);
    if (!parsingResult.cst) {
        return rows;
    }
    // pushing rows of varible declarations
    var variablesTable = [];
    parsingResult.cst.children.VariableDeclaration.forEach(declarationEntry => {
        declarationEntry.children.Identifier.forEach(identifier => {
            var image = identifier.image;
            variablesTable.push(image);
            rows.push(generator.row('variableDeclaration', 'Identifier', image));
        });
    });
    // adding rows of source, dimensions declaration, assing statements.
    parsingResult.cst.children.SourceBlock.forEach((sourceBlock, SBIndex) => {
        // adding source deсlaration
        var SourceDeclaration = sourceBlock.children.SourceDeclaration[0];
        var sourceName = SourceDeclaration.children.Identifier[0].image;
        rows.push(generator.row('sourceDeclaration', 'SourceName', sourceName));
        //adding dimensions
        var dimensions = sourceBlock.children.Dimensions[0].children.DimensionDeclaration;
        dimensions.forEach(dimension => {
            var image = dimension.children.Identifier[0].image;
            var specifier = dimension.children.DimensionSpecifier[0];
            if (specifier.location && specifier.location.endOffset) {
                var specifierStr = parsingResult.formula.text.slice(specifier.location.startOffset, specifier.location.endOffset + 1);
                rows.push(generator.row('dimensionDeclaration', 'DimensionName', image, specifierStr));
            }
        });
        // adding asssign statements 
        sourceBlock.children.AssignStatement.forEach((statement, statementIndex) => {
            var variableImage = statement.children.Identifier[0].image;
            rows.push(generator.row('assignStatement', 'VariableName', variableImage));
            statement.children.parsingResult.forEach((_el, index) => {
                var el = _el;
                var tokenType = 'Error';
                if (el.str && el.tokenType) {
                    if (el.tokenType === 'Identifier') {
                        tokenType = variablesTable.includes(el.str) ? 'VariableName' : 'Mnemonic';
                    }
                    else {
                        tokenType = el.tokenType;
                    }
                }
                rows.push(generator.row('expression', tokenType, el.str));
            });
            rows.push(generator.row('assignStatement', "Equal", '='));
        });
        // adding return statement
        if (parsingResult.cst) {
            var returnStatement = parsingResult.cst.children.ReturnStatement[0].children;
            // !TODO: check if in variableTable
            rows.push(generator.row('returnStatement', 'VariableName', returnStatement.Identifier[0].image));
            rows.push(generator.row('returnStatement', 'Return', returnStatement.Return[0].image));
        }
    });
    return rows;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xlsx_1 = require("./xlsx");
const compiler_1 = require("./compiler");
const rpnbuilder_1 = require("./rpnbuilder");
const prompt = require("prompt-sync")({ sigint: true });
const fs = require("fs");
var rows = (0, xlsx_1.getRows)(10);
var parsedFormula = parseRow(process.argv[2] || "9");
var row = rows.find((row) => row.id == process.argv[2]);
createFiles(parsedFormula);
function runTest() {
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
function convertToTable(parsingResult) {
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
            rows.push(generator.row('variabledeclaration', 'Identifier', image));
        });
    });
    // pushing rows of source, dimensions declaration, assing statements.
    parsingResult.cst.children.SourceBlock.forEach((sourceBlock, SBIndex) => {
        // pushing source dev
        var SourceDeclaration = sourceBlock.children.SourceDeclaration[0];
        var sourceName = SourceDeclaration.children.Identifier[0].image;
        rows.push(generator.row('sourcedeclaration', 'SourceName', sourceName));
        sourceBlock.children.Dimensions[0];
    });
    return rows;
}

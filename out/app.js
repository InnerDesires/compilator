"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xlsx_1 = require("./xlsx");
const compiler_1 = require("./compiler");
//const prompt = require("prompt-sync")({ sigint: true });
const util = require('util');
const fs = require('fs');
var rows = (0, xlsx_1.getRows)(10);
parseRow('44');
/* var errorIndexes: { id: number, index: number }[] = [
    {
        index: 5754,
        id: 568726
    }, //no source
    { index: 5755, id: 569646 },
    { index: 5756, id: 568727 },
    { index: 5757, id: 569647 },
    { index: 5758, id: 276401 },
    { index: 5759, id: 346496 },
    { index: 10540, id: 444678 }, //variable without assign
    { index: 10541, id: 452668 },
] */
/* var array: number[] = [1033, 2054, 3033, 4104, 5055, 1454, 10440, 15000, 21033]
array.forEach( (el) => {
    parseRow(el)
}); */
function runTest() {
    rows.forEach((row, index) => {
        var lexingResult = (0, compiler_1.getLexingResult)(row.text);
        /* lexingResult.tokens.forEach((token: { image: string; tokenType: { name: string; }; }) => {
            console.log({ image: token.image, type: token.tokenType.name })
        }) */
        if (lexingResult.errors.length > 0) {
            console.log(`${row.id}@${index}\n${row.text}`);
            lexingResult.tokens.forEach((token) => {
                console.log({ image: token.image, type: token.tokenType.name, offset: token.startOffset });
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
            prompt('Pres Enter To Continue');
        }
        else {
            //console.log(JSON.stringify(cst, null, 2));
        }
    });
}
function parseRow(id) {
    var row = rows.find(row => row.id == id);
    var lexingResult = (0, compiler_1.getLexingResult)(row.text);
    /* lexingResult.tokens.forEach((token: { image: string; tokenType: { name: string; }; }) => {
        console.log({ image: token.image, type: token.tokenType.name })
    }) */
    if (lexingResult.errors.length > 0) {
        console.log(`${row.id}\n${row.text}`);
        lexingResult.tokens.forEach((token) => {
            console.log({ image: token.image, type: token.tokenType.name, offset: token.startOffset });
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
        prompt('Pres Enter To Continue');
    }
    else {
        var resultSTR = JSON.stringify(cst, null, 2);
        const fileCST = `${process.cwd()}/data//out/${row.id}.json`;
        fs.writeFileSync(fileCST, resultSTR, { encoding: "utf-8" });
        resultSTR = JSON.stringify(lexingResult.tokens, null, 2);
        const fileTable = `${process.cwd()}/data//out/${row.id}.table.json`;
        fs.writeFileSync(fileTable, resultSTR, { encoding: "utf-8" });
    }
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
                console.log({ image: token.image, type: token.tokenType.name, offset: token.startOffset });
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
                id: row.id
            });
            /* console.log(parser.errors);
            console.log(parser.errors[0].context.ruleStack);
            console.log(parser.errors[0].context.ruleOccurrenceStack);
            console.log(row.text); */
        }
        else {
            var resultSTR = JSON.stringify(cst, null, 2);
            //Clipboard.copy(resultSTR);
            console.log(resultSTR);
        }
    });
}

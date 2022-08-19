"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRows = void 0;
const XLSX = require("xlsx");
const workbook = XLSX.readFile(`${process.cwd()}/data/formulas.xlsx`);
var ws = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);
function getRows(startIndex, endIndex) {
    var resultArray = [];
    if (!endIndex) {
        endIndex = ws.length;
    }
    for (let i = startIndex; i < endIndex; i++) {
        var row = ws[i];
        resultArray.push({ id: `${row["__EMPTY_5"]}`, text: row["__EMPTY_7"] });
    }
    return resultArray;
}
exports.getRows = getRows;

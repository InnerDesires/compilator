const oracledb = require('oracledb');
import { FormulaTableRow } from './app'
import { dbConfig } from './config/dbconfig'


function getConnection() {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig, function (err: any, connection: any) {
            if (err) {
                reject(err);
            }
            resolve(connection);
        });
    });
}

function insert(connection: any, row: FormulaTableRow) {
    return new Promise((resolve, reject) => {
        connection.execute(
            `INSERT INTO SCRUDGE3.SFORMULAPREPARE (IDF,TOKENNAMEGROUP,N,TOKENTYPE,IMAGE, DIMENSIONSPECIFIER) 
             VALUES (${row.IDF},${row.TOKENNAMEGROUP},${row.N},${row.TOKENTYPE},${row.IMAGE},${row.DIMENSIONSPECIFIER})`, function (err: any, results: unknown) {
            if (err) {
                reject(err);
            }
            resolve(results);
        });
    });
}

export { getConnection, insert } 

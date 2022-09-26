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
             VALUES (:idf, :tknnmgrp, :n, :tknt, :img, :dimspec )`,
            [row.IDF, row.TOKENNAMEGROUP, row.N, row.TOKENTYPE, row.IMAGE, row.DIMENSIONSPECIFIER], function (err: any, results: unknown) {
                if (err) {
                    reject(err);
                }
                resolve(results);
            });
    });
}

function test(connection: any) {
    return new Promise((resolve, reject) => {
        connection.execute(
            `SELECT * FROM SCRUDGE3.SFORMULAPREPARE `,
            function (err: any, results: unknown) {
                if (err) {
                    reject(err);
                }
                resolve(results);
            });
    });
}
async function closeConnection(connection: any) {
    try {
        await connection.close();
    } catch (err) {
        console.error(err);
    }
}
export { getConnection, insert, closeConnection, test } 
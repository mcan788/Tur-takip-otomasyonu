const sql = require('mssql/msnodesqlv8');
require('dotenv').config();
const logger = require('../utils/logger');

const commonConfig = {
    driver: 'msnodesqlv8',
    server: process.env.DB_SERVER,
    options: {
        trustedConnection: true
    },
    requestTimeout: 180000,
    connectionTimeout: 60000,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const pools = {};

const getPool = async (dbName) => {
    // EMNIYET: Veritabani ismi bos gelirse ana DB'ye yonlen
    if (!dbName || dbName === 'undefined' || dbName === 'null') {
        dbName = 'TurMasterDB';
    }

    if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
        throw new Error(`Geçersiz veritabanı adı formatı: ${dbName}`);
    }

    if (dbName === 'TurMasterDB') {
        if (!masterPool.connected) await masterPool.connect();
        return masterPool;
    }

    if (pools[dbName]) {
        return pools[dbName];
    }

    const config = { 
        ...commonConfig, 
        database: dbName,
        connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${dbName};Trusted_Connection=yes;`
    };
    try {
        const pool = await new sql.ConnectionPool(config).connect();
        pools[dbName] = pool;
        logger.info(`Connected to database: ${dbName}`);
        return pool;
    } catch (err) {
        logger.error(`Database Connection Failed for ${dbName}: `, err);
        throw err;
    }
};

const masterPool = new sql.ConnectionPool({
    ...commonConfig,
    database: 'TurMasterDB',
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=TurMasterDB;Trusted_Connection=yes;`
});

// Master pool'u baslatma yardimcisi
const initMaster = async () => {
    if (!masterPool.connected) {
        await masterPool.connect();
        logger.info('Master Database Pool Connected');
    }
    return masterPool;
};

module.exports = {
    sql,
    getPool,
    masterPool,
    initMaster,
    DB_NAMES: {
        TOUR: process.env.DB_NAME_TOUR,
        RENT: process.env.DB_NAME_RENT
    }
};

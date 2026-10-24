require('dotenv').config();
const logger = require('../utils/logger');
const { sqlMock, SqliteConnectionPool } = require('./sqliteAdapter');

const useMssql = process.env.USE_MSSQL === 'true' && process.platform === 'win32';
let mssqlDriver = null;

if (useMssql) {
    try {
        mssqlDriver = require('mssql/msnodesqlv8');
    } catch (e) {
        logger.warn('[DB] msnodesqlv8 yüklenemedi, SQLite bulut moduna geçiliyor.');
        mssqlDriver = null;
    }
}

const sql = mssqlDriver || sqlMock;

const commonConfig = {
    driver: 'msnodesqlv8',
    server: process.env.DB_SERVER || 'localhost',
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

const createPoolInstance = (dbName) => {
    if (!mssqlDriver) {
        return new SqliteConnectionPool({ database: dbName });
    }
    return new mssqlDriver.ConnectionPool({
        ...commonConfig,
        database: dbName,
        connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${dbName};Trusted_Connection=yes;`
    });
};

const masterPool = createPoolInstance('TurMasterDB');

const getPool = async (dbName) => {
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

    try {
        const pool = await createPoolInstance(dbName).connect();
        pools[dbName] = pool;
        logger.info(`Connected to database: ${dbName}`);
        return pool;
    } catch (err) {
        logger.error(`Database Connection Failed for ${dbName}, falling back to SQLite:`, err.message);
        const fallbackPool = await new SqliteConnectionPool({ database: dbName }).connect();
        pools[dbName] = fallbackPool;
        return fallbackPool;
    }
};

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

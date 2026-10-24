const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbInstances = {};

const formatLocalDateTime = (d = new Date()) => {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    const pad = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
};

const formatLocalDate = (d = new Date()) => {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d || '').slice(0, 10);
    const pad = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

const getWeekNumber = (val) => {
    if (!val) return 1;
    const d = new Date(val);
    if (isNaN(d.getTime())) return 1;
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};

const registerCustomFunctions = (db) => {
    db.function('GETDATE', () => formatLocalDateTime(new Date()));
    db.function('CONVERT_DATE', (val) => formatLocalDate(val));
    db.function('LEN', (val) => (val !== null && val !== undefined ? String(val).length : 0));
    db.function('YEAR', (val) => {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d.getFullYear();
    });
    db.function('MONTH', (val) => {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d.getMonth() + 1;
    });
    db.function('DATEPART_WK', (val) => getWeekNumber(val));
    db.function('FORMAT', (val, fmt) => {
        if (!val) return '';
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        const pad = (n) => String(n).padStart(2, '0');
        if (fmt === 'dd.MM.yyyy') {
            return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
        }
        return formatLocalDate(d);
    });
};

const ensureSchema = (db, dbName) => {
    if (dbName === 'TurMasterDB' || dbName === 'master') {
        db.exec(`
            CREATE TABLE IF NOT EXISTS SystemUsers (
                UserID INTEGER PRIMARY KEY AUTOINCREMENT,
                Username TEXT UNIQUE NOT NULL,
                PasswordHash TEXT NOT NULL,
                FullName TEXT,
                Role TEXT DEFAULT 'SUPERADMIN',
                IsTwoFactorEnabled INTEGER DEFAULT 0,
                TwoFactorSecret TEXT NULL,
                TwoFactorRecoveryCodes TEXT NULL,
                CreatedAt TEXT DEFAULT (datetime('now', 'localtime'))
            );

            CREATE TABLE IF NOT EXISTS Agencies (
                AgencyID INTEGER PRIMARY KEY AUTOINCREMENT,
                AgencyName TEXT NOT NULL,
                Username TEXT NOT NULL,
                OwnerName TEXT NOT NULL,
                OwnerEmail TEXT NOT NULL,
                PasswordHash TEXT NOT NULL,
                AgencyDBName TEXT NOT NULL,
                LicenseKey TEXT UNIQUE NOT NULL,
                LicenseExpiryDate TEXT NOT NULL,
                LicensePrice REAL DEFAULT 0,
                MustChangePassword INTEGER DEFAULT 1,
                IsActive INTEGER DEFAULT 1,
                ModuleType TEXT DEFAULT 'TOUR',
                ParentAgencyID INTEGER NULL,
                IsBranch INTEGER DEFAULT 0,
                AssignedOfficeID INTEGER NULL,
                IsTwoFactorEnabled INTEGER DEFAULT 0,
                TwoFactorSecret TEXT NULL,
                TwoFactorRecoveryCodes TEXT NULL,
                CreatedAt TEXT DEFAULT (datetime('now', 'localtime'))
            );

            CREATE TABLE IF NOT EXISTS SupportTickets (
                id TEXT PRIMARY KEY,
                agencyId INTEGER,
                userId TEXT,
                subject TEXT,
                category TEXT DEFAULT 'Genel Destek',
                priority TEXT DEFAULT 'Normal',
                status TEXT DEFAULT 'Açık',
                createdAt TEXT DEFAULT (datetime('now', 'localtime')),
                updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
            );

            CREATE TABLE IF NOT EXISTS SupportTicketMessages (
                id TEXT PRIMARY KEY,
                ticketId TEXT,
                senderId TEXT,
                message TEXT,
                isMaster INTEGER DEFAULT 0,
                attachmentPath TEXT,
                createdAt TEXT DEFAULT (datetime('now', 'localtime'))
            );
        `);
    } else if (dbName === 'ZYRONOVA_MASTER') {
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                company_id INTEGER DEFAULT 1,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                role_id INTEGER DEFAULT 22,
                is_2fa_enabled INTEGER DEFAULT 0,
                two_factor_secret TEXT NULL,
                two_factor_recovery_codes TEXT NULL
            );
        `);
    } else {
        db.exec(`
            CREATE TABLE IF NOT EXISTS Offices (
                OfficeID INTEGER PRIMARY KEY AUTOINCREMENT,
                OfficeName TEXT NOT NULL,
                Location TEXT,
                CreatedAt TEXT DEFAULT (datetime('now', 'localtime'))
            );

            CREATE TABLE IF NOT EXISTS Tours (
                TourID INTEGER PRIMARY KEY AUTOINCREMENT,
                OfficeID INTEGER NULL,
                TourName TEXT NOT NULL,
                Description TEXT,
                Region TEXT,
                Category TEXT,
                DefaultPrice REAL DEFAULT 0,
                DefaultPassFee REAL DEFAULT 0,
                DefaultCurrency TEXT DEFAULT '€',
                Fields TEXT DEFAULT 'Yetişkin,Çocuk,Bebek',
                PassengerPrice REAL DEFAULT 0,
                DriverPrice REAL DEFAULT 0,
                ChildPrice REAL DEFAULT 0,
                BabyPrice REAL DEFAULT 0,
                CreatedAt TEXT DEFAULT (datetime('now', 'localtime'))
            );

            CREATE TABLE IF NOT EXISTS Expenses (
                ExpenseID INTEGER PRIMARY KEY AUTOINCREMENT,
                OfficeID INTEGER NULL,
                TourID INTEGER NULL,
                Description TEXT,
                Amount REAL DEFAULT 0,
                Category TEXT,
                Currency TEXT DEFAULT '€',
                ExpenseDate TEXT DEFAULT (datetime('now', 'localtime'))
            );

            CREATE TABLE IF NOT EXISTS Staff (
                StaffID INTEGER PRIMARY KEY AUTOINCREMENT,
                FullName TEXT NOT NULL,
                Username TEXT UNIQUE NOT NULL,
                Email TEXT,
                PasswordHash TEXT NOT NULL,
                Role TEXT DEFAULT 'PERSONEL',
                Permissions TEXT NULL,
                IsActive INTEGER DEFAULT 1,
                MustChangePassword INTEGER DEFAULT 0,
                IsTwoFactorEnabled INTEGER DEFAULT 0,
                TwoFactorSecret TEXT NULL,
                TwoFactorRecoveryCodes TEXT NULL,
                CreatedAt TEXT DEFAULT (datetime('now', 'localtime'))
            );

            CREATE TABLE IF NOT EXISTS Bookings (
                BookingID INTEGER PRIMARY KEY AUTOINCREMENT,
                TourID INTEGER,
                OfficeID INTEGER,
                TouristName TEXT,
                HotelName TEXT,
                AdultCount INTEGER DEFAULT 0,
                ChildCount INTEGER DEFAULT 0,
                BabyCount INTEGER DEFAULT 0,
                PassengerCount INTEGER DEFAULT 0,
                DriverCount INTEGER DEFAULT 0,
                VehicleCount INTEGER DEFAULT 0,
                DriverName TEXT,
                ActualPassFee REAL DEFAULT 0,
                Earnings REAL DEFAULT 0,
                Currency TEXT DEFAULT '€',
                Notes TEXT,
                IsApproved INTEGER NOT NULL DEFAULT 0,
                BookingDate TEXT DEFAULT (datetime('now', 'localtime'))
            );
        `);
    }
};

const getSqliteDB = (dbName) => {
    const normalized = (!dbName || dbName === 'master') ? 'TurMasterDB' : dbName;
    if (!dbInstances[normalized]) {
        const dbPath = path.join(DATA_DIR, `${normalized}.sqlite`);
        const db = new DatabaseSync(dbPath);
        db.exec('PRAGMA journal_mode = WAL;');
        registerCustomFunctions(db);
        ensureSchema(db, normalized);
        dbInstances[normalized] = db;
    }
    return dbInstances[normalized];
};

const listSqliteDbNames = () => {
    if (!fs.existsSync(DATA_DIR)) return [];
    return fs.readdirSync(DATA_DIR)
        .filter(f => f.endsWith('.sqlite'))
        .map(f => f.replace(/\.sqlite$/, ''));
};

const BOOL_COLS = new Set([
    'IsActive', 'MustChangePassword', 'IsBranch', 'IsTwoFactorEnabled', 'IsApproved', 'isMaster', 'is_2fa_enabled'
]);

const normalizeRow = (row) => {
    const out = {};
    for (const [k, v] of Object.entries(row)) {
        if (BOOL_COLS.has(k) && (v === 0 || v === 1)) {
            out[k] = v === 1;
        } else {
            out[k] = v;
        }
    }
    return out;
};

const escapeSqlValue = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (typeof val === 'number') return Number.isFinite(val) ? String(val) : '0';
    if (val instanceof Date) return `'${formatLocalDateTime(val)}'`;
    return `'${String(val).replace(/'/g, "''")}'`;
};

class SqliteRequest {
    constructor(dbName) {
        this.dbName = dbName;
        this.params = {};
    }

    input(name, typeOrVal, maybeVal) {
        const value = arguments.length >= 3 ? maybeVal : typeOrVal;
        this.params[name] = value;
        return this;
    }

    async query(rawSql) {
        const db = getSqliteDB(this.dbName);
        let sqlText = String(rawSql || '').trim();

        // 1. Handle CREATE DATABASE [X]
        const createDbMatch = sqlText.match(/CREATE\s+DATABASE\s+\[?([A-Za-z0-9_]+)\]?/i);
        if (createDbMatch && !/INSERT\s+INTO/i.test(sqlText)) {
            const targetDb = createDbMatch[1];
            getSqliteDB(targetDb);
            return { recordset: [], rowsAffected: [0] };
        }

        // 2. Handle DROP DATABASE [X]
        const dropDbMatch = sqlText.match(/DROP\s+DATABASE\s+\[?([A-Za-z0-9_]+)\]?/i);
        if (dropDbMatch) {
            const targetDb = dropDbMatch[1];
            if (dbInstances[targetDb]) {
                try { dbInstances[targetDb].close(); } catch (_) {}
                delete dbInstances[targetDb];
            }
            const dbFile = path.join(DATA_DIR, `${targetDb}.sqlite`);
            if (fs.existsSync(dbFile)) {
                try { fs.unlinkSync(dbFile); } catch (_) {}
            }
            return { recordset: [], rowsAffected: [1] };
        }

        // 3. Handle sys.databases listing
        if (/FROM\s+sys\.databases/i.test(sqlText)) {
            const names = listSqliteDbNames();
            return { recordset: names.map(name => ({ name })), rowsAffected: [names.length] };
        }

        // 4. Handle IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Tours' | 'Staff') SELECT COUNT(*) as c ...
        if (/sys\.tables\s+WHERE\s+name\s*=\s*'Tours'/i.test(sqlText) && /SELECT\s+COUNT\(\*\)\s+as\s+c\s+FROM\s+Tours/i.test(sqlText)) {
            const rows = db.prepare('SELECT COUNT(*) as c FROM Tours').all().map(normalizeRow);
            return { recordset: rows, rowsAffected: [rows.length] };
        }
        if (/sys\.tables\s+WHERE\s+name\s*=\s*'Staff'/i.test(sqlText) && /SELECT\s+COUNT\(\*\)\s+as\s+c\s+FROM\s+Staff/i.test(sqlText)) {
            const rows = db.prepare('SELECT COUNT(*) as c FROM Staff').all().map(normalizeRow);
            return { recordset: rows, rowsAffected: [rows.length] };
        }

        // 5. Strip T-SQL IF NOT EXISTS (SELECT * FROM sys.columns ...) ALTER TABLE ...; prefixes
        sqlText = sqlText.replace(/IF\s+NOT\s+EXISTS\s*\(\s*SELECT\s+\*\s+FROM\s+sys\.columns[^)]*\)\s*ALTER\s+TABLE\s+[^;]+;/gi, '');

        // 6. If the remaining query is purely T-SQL DDL / sys.tables / sys.columns / DECLARE @ConstraintName, skip safely
        if (
            /sys\.(tables|columns|objects|indexes)/i.test(sqlText) &&
            !/INSERT\s+INTO\s+Agencies/i.test(sqlText)
        ) {
            return { recordset: [], rowsAffected: [0] };
        }

        // 7. Capture OUTPUT INSERTED.<Col>
        let outputCol = null;
        const outputMatch = sqlText.match(/OUTPUT\s+INSERTED\.(\w+)/i);
        if (outputMatch) {
            outputCol = outputMatch[1];
            sqlText = sqlText.replace(/OUTPUT\s+INSERTED\.\w+/i, '');
        }

        // 8. Translate T-SQL functions & constructs to SQLite
        sqlText = sqlText
            .replace(/\bISNULL\s*\(/gi, 'COALESCE(')
            .replace(/\bGETUTCDATE\s*\(\s*\)/gi, 'GETDATE()')
            .replace(/CAST\s*\(\s*GETDATE\s*\(\s*\)\s+AS\s+DATE\s*\)/gi, 'CONVERT_DATE(GETDATE())')
            .replace(/CONVERT\s*\(\s*DATE\s*,\s*([^)]+)\)/gi, 'CONVERT_DATE($1)')
            .replace(/DATEPART\s*\(\s*wk\s*,\s*([^)]+)\)/gi, 'DATEPART_WK($1)')
            .replace(/\(SELECT\s+name\s+FROM\s+Agencies\s+WHERE\s+id\s*=\s*t\.agencyId\)/gi, '(SELECT AgencyName FROM Agencies WHERE AgencyID = t.agencyId)');

        // 9. Handle SELECT TOP N ...
        const topMatch = sqlText.match(/^\s*SELECT\s+TOP\s+(\d+)\s+/i);
        if (topMatch) {
            const limitNum = topMatch[1];
            sqlText = sqlText.replace(/^\s*SELECT\s+TOP\s+\d+\s+/i, 'SELECT ');
            sqlText = sqlText.replace(/;?\s*$/, ` LIMIT ${limitNum}`);
        }

        // 10. Substitute @params safely
        sqlText = sqlText.replace(/@(\w+)\b/g, (full, paramName) => {
            if (Object.prototype.hasOwnProperty.call(this.params, paramName)) {
                return escapeSqlValue(this.params[paramName]);
            }
            return 'NULL';
        });

        // 11. Execute query
        const trimmed = sqlText.trim();
        if (!trimmed) {
            return { recordset: [], rowsAffected: [0] };
        }

        if (/^\s*(SELECT|WITH)\b/i.test(trimmed)) {
            const stmt = db.prepare(trimmed);
            const rows = stmt.all().map(normalizeRow);
            return { recordset: rows, rowsAffected: [rows.length] };
        } else {
            const stmt = db.prepare(trimmed);
            const info = stmt.run();
            const recordset = outputCol ? [{ [outputCol]: Number(info.lastInsertRowid) }] : [];
            return {
                recordset,
                rowsAffected: [Number(info.changes || 0)]
            };
        }
    }
}

class SqliteConnectionPool {
    constructor(config = {}) {
        this.dbName = config.database || 'TurMasterDB';
        this.connected = true;
    }

    async connect() {
        getSqliteDB(this.dbName);
        this.connected = true;
        return this;
    }

    request() {
        return new SqliteRequest(this.dbName);
    }

    async close() {
        return true;
    }
}

const sqlMock = {
    ConnectionPool: SqliteConnectionPool,
    NVarChar: 'NVarChar',
    VarChar: 'VarChar',
    Int: 'Int',
    Bit: 'Bit',
    DateTime: 'DateTime',
    Decimal: () => 'Decimal'
};

module.exports = {
    sqlMock,
    SqliteConnectionPool,
    getSqliteDB
};

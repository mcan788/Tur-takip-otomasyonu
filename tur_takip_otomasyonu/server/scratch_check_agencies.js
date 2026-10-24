const { getPool, sql } = require('./config/db');

async function check() {
    try {
        const pool = await getPool('TurMasterDB');
        const result = await pool.request().query("SELECT AgencyID, Username, IsBranch, ParentAgencyID FROM Agencies");
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();

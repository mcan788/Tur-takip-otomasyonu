const { masterPool, initMaster } = require('./config/db');

async function run() {
    await initMaster();
    try {
        await masterPool.query(`ALTER TABLE SupportTickets ADD category NVARCHAR(50) DEFAULT 'Genel Destek'`);
        console.log("category added to SupportTickets");
    } catch (e) { console.error(e.message); }
    try {
        await masterPool.query(`ALTER TABLE SupportTickets ADD priority NVARCHAR(20) DEFAULT 'Normal'`);
        console.log("priority added to SupportTickets");
    } catch (e) { console.error(e.message); }
    try {
        await masterPool.query(`ALTER TABLE SupportTicketMessages ADD attachmentPath NVARCHAR(255) NULL`);
        console.log("attachmentPath added to SupportTicketMessages");
    } catch (e) { console.error(e.message); }
    
    process.exit(0);
}

run();

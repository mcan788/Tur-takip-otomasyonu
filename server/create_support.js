const { masterPool, initMaster, sql } = require('./config/db.js');
async function run() {
    await initMaster();
    const request = masterPool.request();
    await request.query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SupportTickets' and xtype='U')
        CREATE TABLE SupportTickets (
            id NVARCHAR(50) PRIMARY KEY,
            agencyId INT NOT NULL,
            userId NVARCHAR(50) NOT NULL,
            subject NVARCHAR(200) NOT NULL,
            status NVARCHAR(20) DEFAULT 'Açık',
            createdAt DATETIME DEFAULT GETUTCDATE(),
            updatedAt DATETIME DEFAULT GETUTCDATE()
        );
        
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SupportTicketMessages' and xtype='U')
        CREATE TABLE SupportTicketMessages (
            id NVARCHAR(50) PRIMARY KEY,
            ticketId NVARCHAR(50) NOT NULL,
            senderId NVARCHAR(50),
            isMaster BIT DEFAULT 0,
            message NVARCHAR(MAX) NOT NULL,
            createdAt DATETIME DEFAULT GETUTCDATE()
        );
    `);
    console.log('Tables created in TurMasterDB');
    process.exit(0);
}
run().catch(console.error);

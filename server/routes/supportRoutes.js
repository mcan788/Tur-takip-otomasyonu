const express = require('express');
const router = express.Router();
const { masterPool, sql } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/support/');
    },
    filename: function (req, file, cb) {
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Desteklenmeyen dosya türü. Sadece .jpg, .jpeg, .png, .pdf, .docx izin verilir.'), false);
    }
};

const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// AGENCY ROUTES
router.get('/agency', authenticate, async (req, res) => {
    try {
        const agencyId = req.user.agencyId;
        const request = masterPool.request();
        request.input('agencyId', sql.Int, parseInt(agencyId));
        
        const result = await request.query(`
            SELECT id, subject, category, priority, status, createdAt, updatedAt
            FROM SupportTickets
            WHERE agencyId = @agencyId
            ORDER BY updatedAt DESC
        `);
        res.json({ success: true, tickets: result.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/agency', authenticate, upload.single('attachment'), async (req, res) => {
    try {
        const agencyId = req.user.agencyId;
        const { subject, message } = req.body;
        const category = req.body.category || 'Genel Destek';
        const priority = req.body.priority || 'Normal';
        
        if (!subject || !message) {
            return res.status(400).json({ success: false, message: 'Subject and message required' });
        }
        
        const ticketId = uuidv4();
        const request = masterPool.request();
        request.input('id', sql.NVarChar, ticketId);
        request.input('agencyId', sql.Int, parseInt(agencyId));
        request.input('userId', sql.NVarChar, req.user.username || 'unknown');
        request.input('subject', sql.NVarChar, subject);
        request.input('category', sql.NVarChar, category);
        request.input('priority', sql.NVarChar, priority);
        
        await request.query(`
            INSERT INTO SupportTickets (id, agencyId, userId, subject, category, priority)
            VALUES (@id, @agencyId, @userId, @subject, @category, @priority)
        `);
        
        const attachmentPath = req.file ? `/uploads/support/${req.file.filename}` : null;
        
        const msgId = uuidv4();
        const msgRequest = masterPool.request();
        msgRequest.input('id', sql.NVarChar, msgId);
        msgRequest.input('ticketId', sql.NVarChar, ticketId);
        msgRequest.input('senderId', sql.NVarChar, req.user.username || 'unknown');
        msgRequest.input('message', sql.NVarChar, message);
        msgRequest.input('isMaster', sql.Bit, 0);
        msgRequest.input('attachmentPath', sql.NVarChar, attachmentPath);
        
        await msgRequest.query(`
            INSERT INTO SupportTicketMessages (id, ticketId, senderId, message, isMaster, attachmentPath)
            VALUES (@id, @ticketId, @senderId, @message, @isMaster, @attachmentPath)
        `);
        
        res.json({ success: true, message: 'Ticket created', ticketId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/ticket/:id/messages', authenticate, async (req, res) => {
    try {
        const ticketId = req.params.id;
        const request = masterPool.request();
        request.input('ticketId', sql.NVarChar, ticketId);
        
        // Verify ownership
        if (req.user.role !== 'SUPERADMIN') {
            request.input('agencyId', sql.Int, parseInt(req.user.agencyId));
            const verify = await request.query(`SELECT id FROM SupportTickets WHERE id = @ticketId AND agencyId = @agencyId`);
            if (verify.recordset.length === 0) {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            }
        }
        
        const result = await request.query(`
            SELECT id, senderId, isMaster, message, attachmentPath, createdAt
            FROM SupportTicketMessages
            WHERE ticketId = @ticketId
            ORDER BY createdAt ASC
        `);
        
        res.json({ success: true, messages: result.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/ticket/:id/reply', authenticate, upload.single('attachment'), async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { message, status } = req.body;
        
        if (!message && !req.file) {
            return res.status(400).json({ success: false, message: 'Message or attachment required' });
        }
        
        const isMaster = req.user.role === 'SUPERADMIN';
        const senderId = req.user.username || 'admin';
        
        const request = masterPool.request();
        request.input('ticketId', sql.NVarChar, ticketId);
        
        // Verify ownership and status if not master
        if (!isMaster) {
            request.input('agencyId', sql.Int, parseInt(req.user.agencyId));
            const verify = await request.query(`SELECT id, status FROM SupportTickets WHERE id = @ticketId AND agencyId = @agencyId`);
            if (verify.recordset.length === 0) {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            }
            if (verify.recordset[0].status === 'Kapalı') {
                return res.status(400).json({ success: false, message: 'Bu destek talebi kapatılmıştır. Yanıt gönderilemez.' });
            }
        }
        
        const attachmentPath = req.file ? `/uploads/support/${req.file.filename}` : null;
        
        const msgId = uuidv4();
        const msgRequest = masterPool.request();
        msgRequest.input('id', sql.NVarChar, msgId);
        msgRequest.input('ticketId', sql.NVarChar, ticketId);
        msgRequest.input('senderId', sql.NVarChar, senderId);
        msgRequest.input('message', sql.NVarChar, message || 'Dosya eklendi');
        msgRequest.input('isMaster', sql.Bit, isMaster ? 1 : 0);
        msgRequest.input('attachmentPath', sql.NVarChar, attachmentPath);
        
        await msgRequest.query(`
            INSERT INTO SupportTicketMessages (id, ticketId, senderId, message, isMaster, attachmentPath)
            VALUES (@id, @ticketId, @senderId, @message, @isMaster, @attachmentPath)
        `);
        
        // Update ticket status and timestamp
        const newStatus = status || (isMaster ? 'Yanıtlandı' : 'Açık');
        const updateReq = masterPool.request();
        updateReq.input('ticketId', sql.NVarChar, ticketId);
        updateReq.input('status', sql.NVarChar, newStatus);
        
        await updateReq.query(`
            UPDATE SupportTickets 
            SET status = @status, updatedAt = GETUTCDATE()
            WHERE id = @ticketId
        `);
        
        res.json({ success: true, message: 'Reply sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE TICKET (Master Only)
router.delete('/master/ticket/:id', authenticate, async (req, res) => {
    try {
        const isMaster = req.user.role === 'SUPERADMIN';
        if (!isMaster) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        
        const ticketId = req.params.id;
        const request = masterPool.request();
        request.input('ticketId', sql.NVarChar, ticketId);
        
        // Delete messages first (foreign key constraint)
        await request.query(`DELETE FROM SupportTicketMessages WHERE ticketId = @ticketId`);
        
        // Delete ticket
        await request.query(`DELETE FROM SupportTickets WHERE id = @ticketId`);
        
        res.json({ success: true, message: 'Ticket deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// SUPER ADMIN ROUTES
router.get('/master', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({ success: false, message: 'Super admin only' });
        }
        
        const request = masterPool.request();
        const result = await request.query(`
            SELECT t.id, t.agencyId, t.userId, t.subject, t.category, t.priority, t.status, t.createdAt, t.updatedAt,
                   (SELECT name FROM Agencies WHERE id = t.agencyId) as agencyName
            FROM SupportTickets t
            ORDER BY t.updatedAt DESC
        `);
        res.json({ success: true, tickets: result.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

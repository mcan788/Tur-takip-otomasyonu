const express = require('express');
const router = express.Router();
const { chat, status } = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

router.get('/status', authenticate, status);
router.post('/chat', authenticate, chat);

module.exports = router;

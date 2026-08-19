const express = require('express');
const router = express.Router();
const { 
    login, 
    changePassword, 
    forgotPassword,
    getCaptcha,
    verify2FALogin,
    setup2FA,
    activate2FA,
    disable2FA,
    signLicense,
    demoLogin,
    getMe
} = require('../controllers/authController');
const { authenticate, attachDB } = require('../middleware/auth');

router.get('/captcha', getCaptcha);
router.post('/login', attachDB, login);
router.post('/demo-login', attachDB, demoLogin);
router.post('/license-sign', authenticate, signLicense);
router.post('/2fa/login', verify2FALogin);
router.get('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/activate', authenticate, activate2FA);
router.post('/2fa/disable', authenticate, disable2FA);
router.post('/change-password', authenticate, attachDB, changePassword);
router.post('/forgot-password', attachDB, forgotPassword);
router.get('/me', authenticate, attachDB, getMe);

module.exports = router;

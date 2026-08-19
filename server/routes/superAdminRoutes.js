const express = require('express');
const router = express.Router();
const { createAgency, getAgencies, getSuperAdminReport, renewLicense, updateAgency, deleteAgency, getAgencyOfficesForAdmin, resetAgencyPassword } = require('../controllers/superAdminController');
const { authenticate, attachDB, authorize } = require('../middleware/auth');

// Tüm Süper Admin rotaları korumalıdır
router.post('/create-agency', authenticate, authorize('SUPERADMIN'), attachDB, createAgency);
router.get('/agencies', authenticate, authorize('SUPERADMIN'), attachDB, getAgencies);
router.get('/agency-offices/:agencyId', authenticate, authorize('SUPERADMIN'), attachDB, getAgencyOfficesForAdmin);
router.get('/report', authenticate, authorize('SUPERADMIN'), attachDB, getSuperAdminReport);
router.post('/renew-license', authenticate, authorize('SUPERADMIN'), attachDB, renewLicense);
router.put('/update-agency', authenticate, authorize('SUPERADMIN'), attachDB, updateAgency);
router.delete('/delete-agency/:id', authenticate, authorize('SUPERADMIN'), attachDB, deleteAgency);
router.post('/reset-password', authenticate, authorize('SUPERADMIN'), attachDB, resetAgencyPassword);

module.exports = router;

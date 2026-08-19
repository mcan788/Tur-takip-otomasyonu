const express = require('express');
const router = express.Router();
const { 
    createTour, getTours, updateTour, deleteTour,
    createStaff, getStaff, updateStaff, resetStaffPassword, deleteStaff, createBooking, getTourBookings, approveBooking,
    getFinancialReport, getDashboardStats, getOfficeDetails, getAgencyReports, getFullFinancialReport,
    getOffices
} = require('../controllers/agencyController');
const { authenticate, attachDB, authorize, authorizeWithPerm } = require('../middleware/auth');

// Ofis/Şube Yönetimi
router.get('/offices/:agencyId', authenticate, attachDB, getOffices);
router.get('/office/:agencyId/details', authenticate, attachDB, getOfficeDetails);
router.get('/reports', authenticate, attachDB, getAgencyReports);
router.get('/full-report', authenticate, attachDB, getFullFinancialReport);

// Tur Yönetimi
router.post('/tour', authenticate, attachDB, authorizeWithPerm(['AGENCY', 'ADMIN', 'BRANCH_MANAGER'], 'manage_tours'), createTour);
router.put('/tour/:id', authenticate, attachDB, authorizeWithPerm(['AGENCY', 'ADMIN', 'BRANCH_MANAGER'], 'manage_tours'), updateTour);
router.delete('/tour/:id', authenticate, attachDB, authorizeWithPerm(['AGENCY', 'ADMIN', 'BRANCH_MANAGER'], 'manage_tours'), deleteTour);
router.get('/tours/:agencyId', authenticate, attachDB, getTours);
router.get('/tour/:id/bookings', authenticate, attachDB, getTourBookings);
router.post('/booking', authenticate, attachDB, createBooking);
router.put('/booking/:id/approve', authenticate, attachDB, authorizeWithPerm(['AGENCY', 'ADMIN', 'BRANCH_MANAGER'], 'manage_bookings'), approveBooking);

// Personel Yönetimi
router.post('/staff', authenticate, attachDB, authorizeWithPerm(['AGENCY', 'ADMIN', 'BRANCH_MANAGER'], 'manage_personnel'), createStaff);
router.get('/staff/:agencyId', authenticate, attachDB, getStaff);
router.put('/staff/:id', authenticate, attachDB, authorizeWithPerm(['AGENCY', 'ADMIN', 'BRANCH_MANAGER'], 'manage_personnel'), updateStaff);
router.post('/staff/:id/reset-password', authenticate, attachDB, authorizeWithPerm(['AGENCY', 'ADMIN', 'BRANCH_MANAGER'], 'manage_personnel'), resetStaffPassword);
router.delete('/staff/:id', authenticate, attachDB, authorizeWithPerm(['AGENCY', 'ADMIN', 'BRANCH_MANAGER'], 'manage_personnel'), deleteStaff);

// Dashboard ve Raporlar
router.get('/stats/:agencyId', authenticate, attachDB, getDashboardStats);
router.get('/report/:agencyId', authenticate, attachDB, getFinancialReport);

module.exports = router;

const express = require('express');
const { getDashboardStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');
const { requireAdminSecurityPin } = require('../middlewares/adminSecurity');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/dashboard', getDashboardStats);
router.get('/settings', require('../controllers/adminController').getSystemSettings);

// Master PIN Management
router.post('/verify-pin', require('../controllers/adminController').verifyAdminPin);
router.post('/change-pin', require('../controllers/adminController').changeAdminPin);

// Sensitive Economy & Feature Toggles (Protected by Master Security PIN)
router.post('/settings/batch', requireAdminSecurityPin, require('../controllers/adminController').saveBatchSettings);
router.patch('/settings/:key', requireAdminSecurityPin, require('../controllers/adminController').updateSystemSetting);

// Withdrawal Payout Management (Protected by Master Security PIN)
router.get('/withdrawals', require('../controllers/adminController').getAdminWithdrawals);
router.put('/withdrawals/:id/approve', requireAdminSecurityPin, require('../controllers/adminController').approveAdminWithdrawal);
router.put('/withdrawals/:id/reject', requireAdminSecurityPin, require('../controllers/adminController').rejectAdminWithdrawal);

// Push Notification Broadcast & Metrics
router.post('/broadcast-push', require('../controllers/adminController').broadcastPushNotification);
router.get('/push-stats', require('../controllers/adminController').getPushStats);

module.exports = router;

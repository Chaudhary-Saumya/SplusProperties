const express = require('express');
const { 
    register, 
    login, 
    getMe, 
    toggleFavorite, 
    updateDetails, 
    updatePassword, 
    getSessions, 
    revokeSession, 
    revokeAllOtherSessions,
    logout,
    googleLogin,
    completeProfile,
    addPaymentAccount,
    updatePaymentAccount,
    deletePaymentAccount,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const { check } = require('express-validator');
const validate = require('../middlewares/validator');
const router = express.Router();

router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role must be Buyer, Seller, or Broker').isIn(['Buyer', 'Seller', 'Broker']),
    validate
], register);

router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    validate
], login);

router.post('/verify-otp', [
    check('email', 'Email is required').isEmail(),
    check('otp', 'OTP must be 6 digits').isLength({ min: 6, max: 6 }),
    validate
], verifyOTP);

router.post('/resend-otp', [
    check('email', 'Email is required').isEmail(),
    validate
], resendOTP);

router.post('/forgot-password', [
    check('email', 'Please include a valid email').isEmail(),
    validate
], forgotPassword);

router.post('/reset-password', [
    check('email', 'Please include a valid email').isEmail(),
    check('otp', 'OTP must be 6 digits').isLength({ min: 6, max: 6 }),
    check('newPassword', 'Password must be 6 or more characters').isLength({ min: 6 }),
    validate
], resetPassword);

router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.post('/favorites/:id', protect, toggleFavorite);

// Profile & Sessions
router.put('/updatedetails', protect, updateDetails);
router.put('/complete-profile', protect, completeProfile);
router.put('/updatepassword', protect, updatePassword);
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:id', protect, revokeSession);
router.delete('/sessions', protect, revokeAllOtherSessions);
router.get('/logout', protect, logout);

// Payment Accounts
router.post('/payment-accounts', protect, addPaymentAccount);
router.put('/payment-accounts/:id', protect, updatePaymentAccount);
router.delete('/payment-accounts/:id', protect, deletePaymentAccount);

module.exports = router;

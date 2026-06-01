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
    resetPassword,
    deleteMyAccount
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const { check } = require('express-validator');
const validate = require('../middlewares/validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Strict rate limits for OTP/sensitive auth endpoints
const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, error: 'Too many OTP attempts. Please wait 15 minutes before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const otpResendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { success: false, error: 'Too many OTP resend requests. Please wait 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, error: 'Too many password reset requests. Please wait 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

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

router.post('/verify-otp', otpVerifyLimiter, [
    check('email', 'Email is required').isEmail(),
    check('otp', 'OTP must be 6 digits').isLength({ min: 6, max: 6 }),
    validate
], verifyOTP);

router.post('/resend-otp', otpResendLimiter, [
    check('email', 'Email is required').isEmail(),
    validate
], resendOTP);

router.post('/forgot-password', forgotPasswordLimiter, [
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

// Account Deletion (user deletes own account)
router.delete('/delete-account', protect, deleteMyAccount);

module.exports = router;

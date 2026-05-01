const User = require('../models/User');
const Session = require('../models/Session');
const asyncHandler = require('../middlewares/async');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../utils/sendEmail');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Get token from model, create token and send response
const sendTokenResponse = async (user, statusCode, res, req) => {
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    // Create Session entry
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    let browser = 'Unknown';
    let os = 'Unknown';
    
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Macintosh')) os = 'MacOS';
    else if (userAgent.includes('iPhone')) os = 'iOS';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('Linux')) os = 'Linux';

    await Session.create({
        userId: user._id,
        token: token,
        deviceInfo: { browser, os, device: userAgent.substring(0, 50) },
        ipAddress: req.ip || req.connection.remoteAddress
    });

    res.status(statusCode).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, role, phone } = req.body;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({
        name, email, password, role, phone,
        otp,
        otpExpire
    });

    // Send OTP via Email
    try {
        await sendEmail({
            email: user.email,
            subject: 'Email Verification OTP - LandSell',
            message: `Your OTP for account verification is: ${otp}. It will expire in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #2563eb; text-align: center;">Welcome to LandSell!</h2>
                    <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address:</p>
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="letter-spacing: 5px; color: #1e293b; margin: 0;">${otp}</h1>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="text-align: center; color: #94a3b8; font-size: 12px;">&copy; 2026 LandSell Platform. All rights reserved.</p>
                </div>
            `
        });

        res.status(201).json({
            success: true,
            message: 'OTP sent to email. Please verify to complete registration.',
            email: user.email
        });
    } catch (err) {
        console.error('Email Send Error:', err);
        // If email fails, we might want to delete user or just let them resend
        res.status(201).json({
            success: true,
            warning: 'User registered but OTP email failed. Please use Resend OTP.',
            email: user.email
        });
    }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Please provide email and OTP' });
    }

    const user = await User.findOne({ 
        email, 
        otp,
        otpExpire: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, req);
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: 'Please provide email' });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.isVerified) {
        return res.status(400).json({ success: false, error: 'User already verified' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save();

    try {
        await sendEmail({
            email: user.email,
            subject: 'New Email Verification OTP - LandSell',
            message: `Your new OTP for account verification is: ${otp}. It will expire in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #2563eb; text-align: center;">New Verification OTP</h2>
                    <p>Please use the following new One-Time Password (OTP) to verify your email address:</p>
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="letter-spacing: 5px; color: #1e293b; margin: 0;">${otp}</h1>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">This OTP is valid for 10 minutes.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="text-align: center; color: #94a3b8; font-size: 12px;">&copy; 2026 LandSell Platform. All rights reserved.</p>
                </div>
            `
        });

        res.status(200).json({ success: true, message: 'OTP resent to email' });
    } catch (err) {
        console.error('Email Resend Error:', err);
        res.status(500).json({ success: false, error: 'Failed to send OTP email' });
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate email/phone & password
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Please provide an email or phone number and password' });
    }

    // Check for user by email or phone
    const user = await User.findOne({
        $or: [
            { email: email },
            { phone: email }
        ]
    }).select('+password');

    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res, req);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).populate('favorites');
    res.status(200).json({ success: true, data: user });
});

// @desc    Update user profile
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return res.status(401).json({ success: false, error: 'Invalid current password' });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, req);
});

// @desc    Get active sessions
// @route   GET /api/auth/sessions
// @access  Private
exports.getSessions = asyncHandler(async (req, res, next) => {
    const sessions = await Session.find({ userId: req.user.id }).sort('-createdAt');

    res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions,
        currentSessionToken: req.token
    });
});

// @desc    Revoke a session
// @route   DELETE /api/auth/sessions/:id
// @access  Private
exports.revokeSession = asyncHandler(async (req, res, next) => {
    const session = await Session.findById(req.params.id);

    if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.userId.toString() !== req.user.id.toString()) {
        return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    await session.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Revoke all other sessions
// @route   DELETE /api/auth/sessions
// @access  Private
exports.revokeAllOtherSessions = asyncHandler(async (req, res, next) => {
    await Session.deleteMany({
        userId: req.user.id,
        token: { $ne: req.token }
    });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Log user out (Revoke current session)
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
    await Session.deleteOne({ token: req.token });
    res.status(200).json({ success: true, data: {} });
});

// @desc    Toggle favorite property
// @route   POST /api/auth/favorites/:id
// @access  Private
exports.toggleFavorite = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    const listingId = req.params.id;

    if (user.favorites.includes(listingId)) {
        user.favorites = user.favorites.filter(id => id.toString() !== listingId);
    } else {
        user.favorites.push(listingId);
    }

    await user.save();
    res.status(200).json({ success: true, data: user.favorites });
});

// @desc    Google login
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = asyncHandler(async (req, res, next) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, error: 'Please provide a Google ID token' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // 1. Check if user exists by googleId
        let user = await User.findOne({ googleId });

        if (!user) {
            // 2. Check if user exists by email (link accounts)
            user = await User.findOne({ email });

            if (user) {
                user.googleId = googleId;
                await user.save();
            } else {
                // 3. Register new user
                user = await User.create({
                    name,
                    email,
                    googleId,
                    role: 'Buyer', // Default role
                    isVerified: true // Google users are pre-verified
                });
            }
        } else if (!user.isVerified) {
            // If user exists but is linking Google account, mark as verified
            user.isVerified = true;
            await user.save();
        }

        // Check if profile is complete (needs phone or specific role)
        const needsProfileCompletion = !user.phone || !user.role || user.role === 'Buyer' && !user.googleId; // Adjust logic as needed
        // Actually, let's keep it simple: if it's a new google user, they might need to confirm role/phone.
        // The user specifically wants to ask for role and phone if missing.
        const isComplete = !!(user.phone && user.role);

        // Modify sendTokenResponse call or manually send response if we want to include the flag
        // Let's modify sendTokenResponse to accept additional data or just handle it here.
        
        // Create token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '30d'
        });

        // Create Session entry
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        await Session.create({
            userId: user._id,
            token: token,
            deviceInfo: { device: userAgent.substring(0, 50) },
            ipAddress: req.ip || req.connection.remoteAddress
        });

        res.status(200).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
            needsProfileCompletion: !user.phone || !user.role // We'll show the modal if either is missing
        });
    } catch (error) {
        console.error('Google Auth Error Details:', error.message);
        return res.status(401).json({ success: false, error: 'Google authentication failed: ' + error.message });
    }
});

// @desc    Complete profile (role & phone)
// @route   PUT /api/auth/complete-profile
// @access  Private
exports.completeProfile = asyncHandler(async (req, res, next) => {
    const { role, phone } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (role) user.role = role;
    if (phone) user.phone = phone;

    await user.save();

    res.status(200).json({
        success: true,
        data: user
    });
});
// @desc    Add payment account
// @route   POST /api/auth/payment-accounts
// @access  Private
exports.addPaymentAccount = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.paymentAccounts.length >= 3) {
        return res.status(400).json({ success: false, error: 'Maximum of 3 payment accounts allowed' });
    }

    user.paymentAccounts.push(req.body);
    await user.save();

    res.status(200).json({
        success: true,
        data: user.paymentAccounts
    });
});

// @desc    Update payment account
// @route   PUT /api/auth/payment-accounts/:id
// @access  Private
exports.updatePaymentAccount = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const accountIndex = user.paymentAccounts.findIndex(acc => acc._id.toString() === req.params.id);

    if (accountIndex === -1) {
        return res.status(404).json({ success: false, error: 'Payment account not found' });
    }

    // Update fields
    user.paymentAccounts[accountIndex] = { ...user.paymentAccounts[accountIndex].toObject(), ...req.body };
    await user.save();

    res.status(200).json({
        success: true,
        data: user.paymentAccounts
    });
});

// @desc    Delete payment account
// @route   DELETE /api/auth/payment-accounts/:id
// @access  Private
exports.deletePaymentAccount = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.paymentAccounts = user.paymentAccounts.filter(acc => acc._id.toString() !== req.params.id);
    await user.save();

    res.status(200).json({
        success: true,
        data: user.paymentAccounts
    });
});

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: 'Please provide an email' });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ success: false, error: 'No account found with that email' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save();

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset OTP - LandSell',
            message: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #2563eb; text-align: center;">Password Reset</h2>
                    <p>You requested a password reset. Please use the following One-Time Password (OTP) to proceed:</p>
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="letter-spacing: 5px; color: #1e293b; margin: 0;">${otp}</h1>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="text-align: center; color: #94a3b8; font-size: 12px;">&copy; 2026 LandSell Platform. All rights reserved.</p>
                </div>
            `
        });

        res.status(200).json({ success: true, message: 'Password reset OTP sent to email' });
    } catch (err) {
        console.error('Forgot Password Email Error:', err);
        res.status(500).json({ success: false, error: 'Failed to send OTP email' });
    }
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, error: 'Please provide email, OTP and new password' });
    }

    const user = await User.findOne({ 
        email, 
        otp,
        otpExpire: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Set new password
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    // Auto-login after reset
    sendTokenResponse(user, 200, res, req);
});

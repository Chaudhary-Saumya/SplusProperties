const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const { deleteUserAndRelatedData } = require('../utils/userCleanup');
const Session = require('../models/Session');
const asyncHandler = require('../middlewares/async');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../utils/sendEmail');
const { sendSMS, verifyTwilioOTP } = require('../utils/sendSMS');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const ALLOWED_ROLES = ['User', 'Broker', 'Admin'];

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
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            profileImage: user.profileImage || '',
            accountStatus: user.accountStatus,
            isVerified: user.isVerified,
            coinsBalance: user.coinsBalance || 0,
            referralCode: user.referralCode
        }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, role, phone, referralCode } = req.body;

    // Check if user already exists
    if (email || phone) {
        const query = [];
        if (email) query.push({ email });
        if (phone) query.push({ phone });
        
        const existingUser = await User.findOne({ $or: query });

        if (existingUser) {
            if (existingUser.isVerified) {
                const dupField = existingUser.email === email ? 'Email' : 'Phone number';
                return res.status(400).json({
                    success: false,
                    error: `${dupField} is already registered. Please use another one.`
                });
            } else {
                // Delete the unverified user registration so it can be recreated/overwritten
                await deleteUserAndRelatedData(existingUser._id);
            }
        }
    }

    // Standardize user roles: 'User' (Property Owner / Buyer / Seller) vs 'Broker' (Agent). Admin is never assignable publicly.
    let userRole = role === 'Broker' ? 'Broker' : 'User';

    // Check referral code
    let referrerUser = null;
    if (referralCode && typeof referralCode === 'string') {
        referrerUser = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
    }

    // Create user directly with isVerified: true and 100 Welcome Coins (₹5)
    const user = await User.create({
        name,
        email,
        password,
        role: userRole,
        phone,
        isVerified: true,
        coinsBalance: 100,
        totalCoinsEarned: 100,
        referredBy: referrerUser ? referrerUser._id : undefined
    });

    // Record Welcome Login Bonus for new user
    await RewardTransaction.create({
        userId: user._id,
        type: 'WELCOME_LOGIN',
        coins: 100,
        amountINR: 5,
        description: 'Welcome Account Registration & Login Bonus (₹5.00)'
    });

    // Award Referrer 200 Coins (₹10.00) if referral code was used
    if (referrerUser) {
        referrerUser.coinsBalance = (referrerUser.coinsBalance || 0) + 200;
        referrerUser.totalCoinsEarned = (referrerUser.totalCoinsEarned || 0) + 200;
        await referrerUser.save();

        await RewardTransaction.create({
            userId: referrerUser._id,
            type: 'REFERRAL_BONUS',
            coins: 200,
            amountINR: 10,
            description: `Referral Bonus for inviting ${user.name} (₹10.00)`,
            metadata: { referredUserId: user._id }
        });
    }

    // Directly return auth token for instant registration & login
    sendTokenResponse(user, 201, res, req);
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Please provide email or phone and OTP' });
    }

    const user = await User.findOne({ 
        $or: [
            { email: email },
            { phone: email }
        ],
        otpExpire: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Compare hashed OTP
    const isOTPValid = await user.matchOTP(otp);
    if (!isOTPValid) {
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
        return res.status(400).json({ success: false, error: 'Please provide email or phone number' });
    }

    const user = await User.findOne({ 
        $or: [
            { email: email },
            { phone: email }
        ]
    });

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.isVerified) {
        return res.status(400).json({ success: false, error: 'User is already verified' });
    }

    // Generate new OTP
    const plainOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await User.hashOTP(plainOTP);
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = hashedOTP;
    user.otpExpire = otpExpire;
    await user.save();

    if (user.email) {
        sendEmail({
            email: user.email,
            subject: 'New Email Verification OTP - LandSell',
            message: `Your new OTP for account verification is: ${plainOTP}. It will expire in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #2563eb; text-align: center;">New Verification OTP</h2>
                    <p>Please use the following new One-Time Password (OTP) to verify your email address:</p>
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="letter-spacing: 5px; color: #1e293b; margin: 0;">${plainOTP}</h1>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">This OTP is valid for 10 minutes.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="text-align: center; color: #94a3b8; font-size: 12px;">&copy; 2026 LandSell Platform. All rights reserved.</p>
                </div>
            `
        }).catch(err => {
            console.error('Background Email Resend Error:', err);
        });
    }

    if (user.phone) {
        sendSMS({
            phone: user.phone,
            message: `[LandSell] Your new OTP code is ${plainOTP}. Valid for 10 mins.`
        }).catch(err => {
            console.error('Background Resend SMS Error:', err);
        });
    }

    res.status(200).json({ success: true, message: 'New OTP sent successfully via SMS / Email' });
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
        return res.status(401).json({ success: false, error: 'Invalid credentials. Please check your email/phone or password.' });
    }

    // Check if account was created via Google Sign-In without a manual password
    if (!user.password && user.googleId) {
        return res.status(400).json({
            success: false,
            error: "This account was created via Google Sign-In. Please sign in with Google or click 'Forgot Password?' to set a password for manual login."
        });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    /* Commented out OTP verification check for now
    if (!user.isVerified) {
        return res.status(403).json({ success: false, error: 'Please verify OTP before login' });
    }
    */

    if (user.accountStatus && user.accountStatus !== 'Active') {
        return res.status(403).json({
            success: false,
            error: `Account is ${user.accountStatus.toLowerCase()}. Please contact support.`
        });
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
    const fieldsToUpdate = {};
    if (req.body.name !== undefined) fieldsToUpdate.name = req.body.name.trim();
    if (req.body.profileImage !== undefined) fieldsToUpdate.profileImage = req.body.profileImage;
    if (req.body.role !== undefined && ['User', 'Seller', 'Broker'].includes(req.body.role)) {
        fieldsToUpdate.role = req.body.role;
    }

    if (req.body.email) {
        const newEmail = req.body.email.trim().toLowerCase();
        const existingEmail = await User.findOne({ email: newEmail, _id: { $ne: req.user.id } });
        if (existingEmail) {
            return res.status(400).json({ success: false, error: 'This email address is already in use by another account.' });
        }
        fieldsToUpdate.email = newEmail;
    }

    if (req.body.phone) {
        const newPhone = req.body.phone.trim();
        const existingPhone = await User.findOne({ phone: newPhone, _id: { $ne: req.user.id } });
        if (existingPhone) {
            return res.status(400).json({ success: false, error: 'This phone number is already registered to another account.' });
        }
        fieldsToUpdate.phone = newPhone;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    }).populate('favorites');

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

    const updatedUser = await User.findById(req.user.id).populate('favorites');
    const cleanFavorites = (updatedUser.favorites || []).filter(f => f !== null && f !== undefined);

    res.status(200).json({ success: true, data: cleanFavorites });
});

// @desc    Google login
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = asyncHandler(async (req, res, next) => {
    const { idToken, referralCode } = req.body;

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
                // Find referrer if referralCode provided
                let referrer = null;
                if (referralCode) {
                    referrer = await User.findOne({ referralCode: String(referralCode).trim().toUpperCase() });
                }

                const randStr = Math.random().toString(36).substring(2, 8).toUpperCase();

                // 3. Register new user with welcome bonus
                user = await User.create({
                    name,
                    email,
                    googleId,
                    role: 'Buyer', // Default role
                    isVerified: true, // Google users are pre-verified
                    referralCode: `KP${randStr}`,
                    coinsBalance: 100,
                    totalCoinsEarned: 100,
                    referredBy: referrer ? referrer._id : undefined
                });

                const RewardTransaction = require('../models/RewardTransaction');
                await RewardTransaction.create({
                    userId: user._id,
                    type: 'WELCOME_LOGIN',
                    coins: 100,
                    amountINR: 5,
                    description: 'Welcome Account Registration & Login Bonus (₹5.00)'
                });

                // If referred by another user, award referrer 200 coins (₹10.00)
                if (referrer) {
                    referrer.coinsBalance = (referrer.coinsBalance || 0) + 200;
                    referrer.totalCoinsEarned = (referrer.totalCoinsEarned || 0) + 200;
                    await referrer.save();

                    await RewardTransaction.create({
                        userId: referrer._id,
                        type: 'REFERRAL_BONUS',
                        coins: 200,
                        amountINR: 10,
                        description: `Referral Reward: ${user.name || user.email} joined with your code (₹10.00)`,
                        metadata: { referredUserId: user._id }
                    });
                }
            }
        } else if (!user.isVerified) {
            // If user exists but is linking Google account, mark as verified
            user.isVerified = true;
            await user.save();
        }

        if (user.accountStatus && user.accountStatus !== 'Active') {
            return res.status(403).json({
                success: false,
                error: `Account is ${user.accountStatus.toLowerCase()}. Please contact support.`
            });
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
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                accountStatus: user.accountStatus,
                isVerified: user.isVerified
            },
            needsProfileCompletion: !user.phone || !user.role // We'll show the modal if either is missing
        });
    } catch (error) {
        console.error('Google Auth Error Details:', error.message);
        return res.status(401).json({ success: false, error: 'Google authentication failed: ' + error.message });
    }
});

// @desc    Send Phone OTP for Profile Completion
// @route   POST /api/auth/send-phone-otp
// @access  Private
exports.sendPhoneOTP = asyncHandler(async (req, res, next) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number' });
    }

    const normalizedPhone = String(phone).replace(/\D/g, '');
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
        return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number' });
    }

    // Check if phone number is already registered to another active user
    const existingUser = await User.findOne({ phone: normalizedPhone, _id: { $ne: req.user.id } });
    if (existingUser && existingUser.isVerified) {
        return res.status(400).json({ 
            success: false, 
            error: 'This phone number is already registered to another account. Please use a different phone number.' 
        });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Generate 6-digit OTP
    const plainOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await User.hashOTP(plainOTP);
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = hashedOTP;
    user.otpExpire = otpExpire;
    await user.save();

    // Send SMS via Twilio / Fast2SMS
    await sendSMS({
        phone: normalizedPhone,
        message: `[LandSell] Your verification OTP for mobile number setup is ${plainOTP}. Valid for 10 mins.`
    }).catch(err => {
        console.error('Phone OTP Send Error:', err);
    });

    res.status(200).json({
        success: true,
        message: `Verification OTP sent to +91 ${normalizedPhone} via SMS`,
        phone: normalizedPhone
    });
});

// @desc    Verify Phone OTP & Complete Profile
// @route   POST /api/auth/verify-phone-otp
// @access  Private
exports.verifyPhoneOTP = asyncHandler(async (req, res, next) => {
    const { phone, otp, role } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ success: false, error: 'Please enter your phone number and 6-digit OTP' });
    }

    const normalizedPhone = String(phone).replace(/\D/g, '');

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Try Twilio Verify API Verification Check first
    const twilioCheck = await verifyTwilioOTP({ phone: normalizedPhone, code: otp });

    let isMatch = false;
    if (twilioCheck.success && twilioCheck.valid) {
        isMatch = true;
    } else if (twilioCheck.fallbackToLocal) {
        if (!user.otpExpire || user.otpExpire < Date.now()) {
            return res.status(400).json({ success: false, error: 'OTP has expired. Please click resend to get a new SMS OTP.' });
        }
        isMatch = await user.matchOTP(otp);
    }

    if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Invalid OTP code. Please enter the correct 6-digit SMS OTP.' });
    }

    let cleanRole = (role === 'Broker' || role === 'Admin') ? role : 'User';
    user.role = cleanRole;
    user.phone = normalizedPhone;
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Mobile number verified and profile completed successfully!',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            isVerified: user.isVerified,
            accountStatus: user.accountStatus
        }
    });
});

// @desc    Complete profile (legacy fallback)
// @route   PUT /api/auth/complete-profile
// @access  Private
exports.completeProfile = asyncHandler(async (req, res, next) => {
    const { role, phone, referralCode } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    let cleanRole = role === 'Broker' ? 'Broker' : 'User';
    user.role = cleanRole;

    if (phone) {
        const normalizedPhone = String(phone).replace(/\D/g, '');
        if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
            return res.status(400).json({ success: false, error: 'Please provide a valid phone number' });
        }
        user.phone = normalizedPhone;
    }

    if (!user.phone) {
        return res.status(400).json({ success: false, error: 'Phone number is required to complete profile' });
    }

    // Process referral code if provided and not yet referred
    if (referralCode && !user.referredBy) {
        const RewardTransaction = require('../models/RewardTransaction');
        const referrer = await User.findOne({ referralCode: String(referralCode).trim().toUpperCase() });
        if (referrer && referrer._id.toString() !== user._id.toString()) {
            user.referredBy = referrer._id;
            referrer.coinsBalance = (referrer.coinsBalance || 0) + 200;
            referrer.totalCoinsEarned = (referrer.totalCoinsEarned || 0) + 200;
            await referrer.save();

            await RewardTransaction.create({
                userId: referrer._id,
                type: 'REFERRAL_BONUS',
                coins: 200,
                amountINR: 10,
                description: `Referral Reward: ${user.name || user.phone} signed up with your code (₹10.00)`,
                metadata: { referredUserId: user._id }
            });
        }
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Toggle user role between User and Broker
// @route   PUT /api/auth/toggle-broker
// @access  Private
exports.toggleBrokerRole = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.role = user.role === 'Broker' ? 'User' : 'Broker';
    await user.save();

    res.status(200).json({
        success: true,
        message: user.role === 'Broker' ? 'Registered as a Real Estate Broker' : 'Broker status disabled',
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
        }
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
        return res.status(400).json({ success: false, error: 'Please provide an email address or phone number' });
    }

    const user = await User.findOne({
        $or: [
            { email: email },
            { phone: email }
        ]
    });

    if (!user) {
        return res.status(404).json({ success: false, error: 'No registered account found with that email or phone number' });
    }

    // Generate OTP
    const plainOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await User.hashOTP(plainOTP);
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = hashedOTP;
    user.otpExpire = otpExpire;
    await user.save();

    // Send password reset OTP via Email asynchronously in the background
    if (user.email) {
        sendEmail({
            email: user.email,
            subject: 'Password Reset OTP - LandSell',
            message: `Your OTP for password reset is: ${plainOTP}. It will expire in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #2563eb; text-align: center;">Password Reset</h2>
                    <p>You requested a password reset. Please use the following One-Time Password (OTP) to proceed:</p>
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="letter-spacing: 5px; color: #1e293b; margin: 0;">${plainOTP}</h1>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="text-align: center; color: #94a3b8; font-size: 12px;">&copy; 2026 LandSell Platform. All rights reserved.</p>
                </div>
            `
        }).catch(err => {
            console.error('Background Forgot Password Email Error:', err);
        });
    }

    if (user.phone) {
        sendSMS({
            phone: user.phone,
            message: `[LandSell] Your password reset OTP code is ${plainOTP}. Valid for 10 mins.`
        }).catch(err => {
            console.error('Background Forgot Password SMS Error:', err);
        });
    }

    res.status(200).json({ success: true, message: 'Password reset OTP sent successfully via SMS / Email', email: user.email || user.phone });
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, error: 'Please provide email or phone, OTP and new password' });
    }

    const user = await User.findOne({ 
        $or: [
            { email: email },
            { phone: email }
        ],
        otpExpire: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Compare hashed OTP
    const isOTPValid = await user.matchOTP(otp);
    if (!isOTPValid) {
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

// @desc    Delete own account
// @route   DELETE /api/auth/delete-account
// @access  Private
exports.deleteMyAccount = asyncHandler(async (req, res, next) => {
    const { password } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Google-only users won't have a password — skip password check
    if (user.password) {
        if (!password) {
            return res.status(400).json({ success: false, error: 'Please provide your password to confirm account deletion' });
        }
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Incorrect password. Account deletion cancelled.' });
        }
    }

    // Prevent Admin from self-deleting via this route
    if (user.role === 'Admin') {
        return res.status(403).json({ success: false, error: 'Admin accounts cannot be deleted through this route.' });
    }

    const userName = user.name;
    const userEmail = user.email;

    // Delete user and all related data
    await deleteUserAndRelatedData(req.user.id);

    // Send goodbye email asynchronously in the background
    sendEmail({
        email: userEmail,
        subject: 'Account Deleted — LandSell',
        message: `Your account has been permanently deleted. All your data has been removed.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: #dc2626; text-align: center;">Account Deleted</h2>
                <p>Hi ${userName},</p>
                <p>Your LandSell account has been <strong>permanently deleted</strong>. All your listings, inquiries, saved maps, and personal data have been removed from our system.</p>
                <p style="color: #64748b; font-size: 14px;">If you did not request this, please contact our support immediately.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="text-align: center; color: #94a3b8; font-size: 12px;">&copy; 2026 LandSell Platform. All rights reserved.</p>
            </div>
        `
    }).catch(emailErr => {
        // Email failure is non-critical — account is already deleted
        console.error('Goodbye email failed:', emailErr.message);
    });

    res.status(200).json({
        success: true,
        message: 'Your account and all associated data have been permanently deleted.'
    });
});

// @desc    Register or update device FCM push token
// @route   POST /api/auth/fcm-token
// @access  Private
exports.registerFcmToken = asyncHandler(async (req, res) => {
    const { token, platform = 'android', deviceModel = '' } = req.body;

    if (!token) {
        return res.status(400).json({ success: false, message: 'FCM token is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.fcmTokens) user.fcmTokens = [];

    // Remove existing entry for this token if present to prevent duplicates
    user.fcmTokens = user.fcmTokens.filter(t => t.token !== token);

    // Keep max 5 active devices per user
    if (user.fcmTokens.length >= 5) {
        user.fcmTokens.shift();
    }

    user.fcmTokens.push({
        token,
        platform,
        deviceModel,
        lastActive: new Date()
    });

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: 'Device token registered successfully',
        deviceCount: user.fcmTokens.length
    });
});

// @desc    Remove device FCM push token (e.g. on logout)
// @route   DELETE /api/auth/fcm-token
// @access  Private
exports.removeFcmToken = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ success: false, message: 'FCM token is required' });
    }

    await User.findByIdAndUpdate(req.user.id, {
        $pull: { fcmTokens: { token } }
    });

    res.status(200).json({
        success: true,
        message: 'Device token removed successfully'
    });
});

// @desc    Update user notification preferences
// @route   PUT /api/auth/notification-preferences
// @access  Private
exports.updateNotificationPreferences = asyncHandler(async (req, res) => {
    const { newListingAlerts, priceDropAlerts, inactivityReminders, marketingPromos } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.notificationPreferences) {
        user.notificationPreferences = {};
    }

    if (newListingAlerts !== undefined) user.notificationPreferences.newListingAlerts = Boolean(newListingAlerts);
    if (priceDropAlerts !== undefined) user.notificationPreferences.priceDropAlerts = Boolean(priceDropAlerts);
    if (inactivityReminders !== undefined) user.notificationPreferences.inactivityReminders = Boolean(inactivityReminders);
    if (marketingPromos !== undefined) user.notificationPreferences.marketingPromos = Boolean(marketingPromos);

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        data: user.notificationPreferences
    });
});

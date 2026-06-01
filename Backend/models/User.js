const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const paymentAccountSchema = new mongoose.Schema({
    accountType: { type: String, enum: ['UPI', 'Bank', 'Phone'] },
    holderName: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    upiId: String,
    mobileNumber: String,
    isDefault: { type: Boolean, default: false }
});

// Mask sensitive payment information when returning to API
const maskPaymentAccount = (doc, ret) => {
    if (ret.accountNumber) {
        ret.accountNumber = ret.accountNumber.length > 4 
            ? 'x'.repeat(ret.accountNumber.length - 4) + ret.accountNumber.slice(-4)
            : ret.accountNumber;
    }
    if (ret.upiId) {
        const parts = ret.upiId.split('@');
        if (parts.length === 2) {
            const [u, d] = parts;
            ret.upiId = (u.length > 2 ? u.slice(0, 2) + 'x'.repeat(u.length - 2) : 'xx') + '@' + d;
        } else {
            ret.upiId = ret.upiId.length > 4 ? 'x'.repeat(ret.upiId.length - 4) + ret.upiId.slice(-4) : ret.upiId;
        }
    }
    if (ret.mobileNumber) {
        ret.mobileNumber = ret.mobileNumber.length > 4
            ? 'x'.repeat(ret.mobileNumber.length - 4) + ret.mobileNumber.slice(-4)
            : ret.mobileNumber;
    }
    if (ret.ifscCode) {
        ret.ifscCode = ret.ifscCode.length > 4
            ? ret.ifscCode.slice(0, 4) + 'x'.repeat(ret.ifscCode.length - 4)
            : ret.ifscCode;
    }
    return ret;
};

paymentAccountSchema.set('toJSON', { transform: maskPaymentAccount });
paymentAccountSchema.set('toObject', { transform: maskPaymentAccount });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [function() { return !this.googleId; }, 'Please add a password'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['Buyer', 'Seller', 'Broker', 'Admin'],
        default: 'Buyer'
    },
    phone: {
        type: String,
        required: [function() { return !this.googleId; }, 'Please add a phone number'],
        unique: true,
        sparse: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    favorites: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Listing'
    }],
    paymentAccounts: {
        type: [paymentAccountSchema],
        validate: [v => v.length <= 3, 'Cannot have more than 3 payment accounts']
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    accountStatus: {
        type: String,
        enum: ['Active', 'Disabled', 'Suspended'],
        default: 'Active'
    },
    otp: String,        // stores hashed OTP
    otpExpire: Date
}, { timestamps: true });

// Encrypt password before save
userSchema.pre('save', async function() {
    if (!this.password || !this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Hash a plain OTP and return it (use before saving to DB)
userSchema.statics.hashOTP = async function(plainOTP) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plainOTP, salt);
};

// Compare plain OTP against stored hash
userSchema.methods.matchOTP = async function(plainOTP) {
    if (!this.otp) return false;
    return bcrypt.compare(plainOTP, this.otp);
};

module.exports = mongoose.model('User', userSchema);

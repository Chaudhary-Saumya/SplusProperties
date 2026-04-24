const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
        type: [{
            accountType: { type: String, enum: ['UPI', 'Bank', 'Phone'] },
            holderName: String,
            bankName: String,
            accountNumber: String,
            ifscCode: String,
            upiId: String,
            mobileNumber: String,
            isDefault: { type: Boolean, default: false }
        }],
        validate: [v => v.length <= 3, 'Cannot have more than 3 payment accounts']
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: String,
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

module.exports = mongoose.model('User', userSchema);

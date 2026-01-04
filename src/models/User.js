const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        minLength: 3,
        maxLength: 30
    },
    email: {
        type: String,
        unique: true,
        index: true,
        required: true,
        lowercase: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid Email !")
            }
        }
    },
    password: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isStrongPassword(value)) {
                throw new Error("Please use a strong password !")
            }
        }
    },

    // ✅ NEW FIELD: Role Management
    // Default hum 'guest' rakh rahe hain
    role: {
        type: String,
        enum: ['admin', 'author', 'guest'],
        default: 'guest'
    },

    // OTP fields
    resetOTP: {
        type: Number,
        default: null
    },
    resetOTPExpire: {
        type: Date,
        default: null
    },
    isOTPVerified: {
        type: Boolean,
        default: false
    },

    // Status Field
    // Isse hum user ko block/unblock karenge
    isActive: {
        type: Boolean,
        default: true, // Naye users active honge by default
    },
    
    tokens: {
        type: [Object],
        required: false,
        default: []
    },
    
    settings: {
        twoFactor: { type: Boolean, default: true },
        privateProfile: { type: Boolean, default: false },
        emailNotifications: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
    }

}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = {
    User
}
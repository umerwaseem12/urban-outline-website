const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    resetTokenHash: {
      type: String,
      select: false,
    },
    resetTokenExpiresAt: {
      type: Date,
      select: false,
    },
    emailVerified: {
      type: Boolean,
    },
    verifyTokenHash: {
      type: String,
      select: false,
    },
    verifyTokenExpiresAt: {
      type: Date,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    customPhoto: {
      type: Buffer,
      select: false,
    },
    hasCustomPhoto: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('User', userSchema)
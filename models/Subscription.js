const mongoose = require('mongoose');
const validator = require('validator');

const subscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  unsubscribeToken: String
});

subscriptionSchema.pre('save', function(next) {
  if (this.isNew) {
    this.verificationToken = require('crypto').randomBytes(32).toString('hex');
    this.unsubscribeToken = require('crypto').randomBytes(32).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
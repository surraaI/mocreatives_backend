const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin'],
    default: 'admin'
  },
  profilePhoto: {
    type: {
      url: {
        type: String,
        default: '',
        validate: {
          validator: function(v) {
            if (!v) return true; // Allow empty
            return validator.isURL(v, {
              protocols: ['http','https'],
              require_protocol: true,
              host_whitelist: ['res.cloudinary.com']
            });
          },
          message: 'Must be a valid Cloudinary URL'
        }
      },
      public_id: {
        type: String,
        default: ''
      }
    },
    default: null
  },
  linkedinLink: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true;
        return validator.matches(v, /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/);
      },
      message: 'Invalid LinkedIn URL format. Use: https://linkedin.com/in/username'
    }
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  passwordResetRequired: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'profilePhoto.public_id': 1 });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordResetRequired = false;
  next();
});

// Track password change time
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// SuperAdmin validation
userSchema.pre('save', async function(next) {
  if (this.role === 'superadmin') {
    const existingSuperAdmin = await this.constructor.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin && !existingSuperAdmin._id.equals(this._id)) {
      const err = new Error('Only one SuperAdmin can exist');
      err.name = 'ValidationError';
      return next(err);
    }
    
    // Ensure first superadmin can't be deleted
    if (this.isDeleted) {
      return next(new Error('SuperAdmin cannot be deleted'));
    }
  }
  next();
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Password change check method
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Password reset token method
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
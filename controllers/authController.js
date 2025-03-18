const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendAdminCredentials, sendPasswordReset } = require('../services/emailService');
const { promisify } = require('util');
const AppError = require('../utils/appError');
const validator = require('validator');

const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN
});

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Remove sensitive data from response
  user.password = undefined;
  user.passwordChangedAt = undefined;
  user.passwordResetRequired = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
};

exports.registerAdmin = async (req, res, next) => {
  try {
    // 1) Generate random password (plain text)
    const generatedPassword = crypto.randomBytes(8).toString('hex');

    // 2) Create admin user with plain text password
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: generatedPassword, // Let the pre-save hook hash this
      role: 'admin',
      passwordResetRequired: true
    });

    // 3) Send credentials email with PLAIN TEXT password
    await sendAdminCredentials({
      email: newUser.email,
      password: generatedPassword,
      name: newUser.name
    });

    // 4) Send response
    createSendToken(newUser, 201, res);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check for empty fields
    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Find user with password
    const user = await User.findOne({ email }).select('+password');

    // 3) Check if user exists
    if (!user) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 4) Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    console.log(isPasswordCorrect);
    console.log(password);
    if (!isPasswordCorrect) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 5) Check if password reset required
    if (user.passwordResetRequired) {
      return next(new AppError('Password reset required', 401, 'reset_required'));
    }

    // 6) If everything ok, send token
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    // 1) Validate email format first
    if (!validator.isEmail(req.body.email)) {
      return next(new AppError('Please provide a valid email address', 400));
    }

    // 2) Get user based on POSTed email
    const user = await User.findOne({ 
      email: req.body.email,
      role: { $in: ['admin', 'superadmin'] } // Only allow admins to reset password
    });

    // 3) Always return success message even if user not found
    if (!user) {
      return res.status(200).json({
        status: 'success',
        message: 'If the email exists, a reset link will be sent'
      });
    }

    // 4) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 5) Send password reset email
    try {
      await sendPasswordReset({
        email: user.email,
        name: user.name,
        resetUrl: `${process.env.CLIENT_URL}/reset-password/${resetToken}`
      });
    } catch (err) {
      // Reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Error sending email. Try again later!', 500));
    }

    // 6) Send success response
    res.status(200).json({
      status: 'success',
      message: 'Password reset instructions sent to email'
    });
    
  } catch (err) {
    next(err);
  }
};
exports.resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // 3) Update password and remove reset token
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetRequired = false;
    await user.save();

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.comparePassword(req.body.currentPassword, user.password))) {
      return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.newPassword;
    user.passwordResetRequired = false;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

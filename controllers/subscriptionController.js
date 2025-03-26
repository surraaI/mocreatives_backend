const Subscription = require('../models/Subscription');
const { sendVerificationEmail } = require('../services/emailService');
const AppError = require('../utils/appError');

exports.subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if email exists
    const existing = await Subscription.findOne({ email });
    if (existing) {
      return next(new AppError('This email is already subscribed', 400));
    }

    const subscription = await Subscription.create({ email });

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/subscriptions/verify/${subscription.verificationToken}`;
    await sendVerificationEmail({
      email,
      verificationUrl,
      unsubscribeUrl: `${process.env.CLIENT_URL}/unsubscribe/${subscription.unsubscribeToken}`
    });

    res.status(201).json({
      status: 'success',
      message: 'Verification email sent'
    });
  } catch (err) {
    next(err);
  }
};

exports.verify = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { verificationToken: req.params.token },
      { verified: true },
      { new: true }
    );

    if (!subscription) {
      return next(new AppError('Invalid verification token', 400));
    }

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.unsubscribe = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOneAndDelete({
      unsubscribeToken: req.params.token
    });

    if (!subscription) {
      return next(new AppError('Invalid unsubscribe token', 400));
    }

    res.status(200).json({
      status: 'success',
      message: 'Unsubscribed successfully'
    });
  } catch (err) {
    next(err);
  }
};
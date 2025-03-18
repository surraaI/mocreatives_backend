const User = require('../models/User');
const bcrypt = require('bcryptjs');
const upload = require('../middleware/upload');
const { sendAdminCredentials } = require('../services/emailService');
const crypto = require('crypto');
const AppError = require('../utils/appError');
const { filterObject } = require('../utils/helpers');

exports.updateAdmin = [
  upload.single('profilePhoto'),
  async (req, res, next) => {
    try {
      const userToUpdate = await User.findById(req.params.id);
      if (!userToUpdate) return next(new AppError('No user found with that ID', 404));

      // Prevent role escalation for non-superadmins
      if (req.body.role && req.user.role !== 'superadmin') {
        return next(new AppError('Only SuperAdmins can modify roles', 403));
      }

      // Filter allowed fields
      const filteredBody = filterObject(
        req.body,
        'name',
        'email',
        'linkedinLink',
        'role'
      );

      // Handle profile photo upload
      if (req.file) {
        filteredBody.profilePhoto = req.file.path;
      }

      // Email update validation
      if (filteredBody.email && filteredBody.email !== userToUpdate.email) {
        const existingUser = await User.findOne({ email: filteredBody.email });
        if (existingUser) {
          return next(new AppError('Email is already in use', 400));
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        filteredBody,
        { new: true, runValidators: true }
      ).select('-password -__v');

      res.json({
        status: 'success',
        data: { user: updatedUser }
      });
    } catch (err) {
      next(err);
    }
  }
];

exports.deleteAdmin = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(new AppError('No user found with that ID', 404));

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
const User = require('../models/User');
const AppError = require('../utils/appError');
const { filterObject } = require('../utils/helpers');
const fs = require('fs/promises');
const path = require('path');

exports.updateAdmin = async (req, res, next) => {
  try {
    // Authorization check
    if (req.user.role === 'admin' && req.params.id !== req.user.id) {
      return next(new AppError('You can only update your own profile', 403));
    }

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return next(new AppError('No user found with that ID', 404));
    }

    // Define allowed fields based on role
    const allowedFields = ['name', 'linkedinLink'];
    if (req.user.role === 'superadmin') {
      allowedFields.push('email', 'role');
    }

    // Filter request body
    const filteredBody = filterObject(req.body, ...allowedFields);

    // Handle profile photo upload
    if (req.file) {
      // Delete old photo if exists
      if (userToUpdate.profilePhoto) {
        const oldPhotoPath = path.join(__dirname, '..', userToUpdate.profilePhoto);
        await fs.unlink(oldPhotoPath).catch(() => {}); // Silent fail if file doesn't exist
      }
      filteredBody.profilePhoto = req.file.path;
    }

    // Prevent role modification for non-superadmins
    if (filteredBody.role && req.user.role !== 'superadmin') {
      return next(new AppError('Only SuperAdmins can modify roles', 403));
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
};

exports.deleteAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    // Delete associated profile photo
    if (user.profilePhoto) {
      const photoPath = path.join(__dirname, '..', user.profilePhoto);
      await fs.unlink(photoPath).catch(() => {}); // Silent fail if file doesn't exist
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
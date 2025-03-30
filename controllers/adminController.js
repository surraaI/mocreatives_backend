const User = require('../models/User');
const AppError = require('../utils/appError');
const { filterObject } = require('../utils/helpers');
const { v2: cloudinary } = require('cloudinary');

exports.getAllAdmins = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    
    const query = User.find({ 
      role: { $in: ['admin', 'superadmin'] } 
    }).select('-password -__v');

    const sort = req.query.sort || '-createdAt';
    query.sort(sort).skip(skip).limit(limit);

    const [admins, total] = await Promise.all([
      query.exec(),
      User.countDocuments({ role: { $in: ['admin', 'superadmin'] } })
    ]);

    res.json({
      status: 'success',
      results: admins.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { admins }
    });
  } catch (err) {
    next(err);
  }
};

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

    // Allowed fields configuration
    const allowedFields = ['name', 'linkedinLink'];
    if (req.user.role === 'superadmin') {
      allowedFields.push('email', 'role');
    }

    const filteredBody = filterObject(req.body, ...allowedFields);

    // Handle profile photo upload
    if (req.file) {
      // Delete old photo from Cloudinary if exists
      if (userToUpdate.profilePhoto?.public_id) {
        await cloudinary.uploader
          .destroy(userToUpdate.profilePhoto.public_id)
          .catch(err => console.error('Cloudinary deletion error:', err));
      }

      filteredBody.profilePhoto = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    // Prevent role escalation
    if (filteredBody.role && req.user.role !== 'superadmin') {
      return next(new AppError('Only SuperAdmins can modify roles', 403));
    }

    // Email conflict check
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

    // Delete Cloudinary asset if exists
    if (user.profilePhoto?.public_id) {
      await cloudinary.uploader
        .destroy(user.profilePhoto.public_id)
        .catch(err => console.error('Cloudinary deletion error:', err));
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
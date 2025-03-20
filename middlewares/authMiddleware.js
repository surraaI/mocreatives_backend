const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Renamed from authMiddleware to authenticate
exports.authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles[0].includes(req.user.role)) {
    return res.status(403).json({ message: 'Permission denied' });
  }
  next();
};

exports.checkOwnership = (model) => async (req, res, next) => {
  try {
    const document = await model.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    
    if (req.user.role !== 'superadmin' && document.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
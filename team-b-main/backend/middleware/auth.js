const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-me';

/**
 * Middleware to protect routes - verify JWT token
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (req.user.status !== 'active' || req.user.isActive === false) {
      return res.status(403).json({
        status: 'error',
        message: 'Account is inactive'
      });
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route'
    });
  }
};

/**
 * Grant access to specific roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

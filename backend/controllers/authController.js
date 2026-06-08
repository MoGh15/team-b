const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-me';

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '24h'
  });
};

/**
 * Login User
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, username, identifier, password } = req.body;
    const loginIdentifier = email || username || identifier;

    // Validation
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide username or email and password'
      });
    }

    // Check for user
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { name: loginIdentifier }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login'
    });
  }
};

/**
 * Get Current User
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

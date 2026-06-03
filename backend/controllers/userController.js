const User = require('../models/User');

/**
 * Get all users
 * GET /api/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      status: 'success',
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch users'
    });
  }
};

/**
 * Get single user
 * GET /api/users/:id
 */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch user'
    });
  }
};

/**
 * Create new user
 * POST /api/users
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'receptionist',
      status: status || 'active'
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create user'
    });
  }
};

/**
 * Update user
 * PUT /api/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, role, status, password } = req.body;

    // Find user
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (role) user.role = role;
    if (status) user.status = status;
    if (password) user.password = password;

    // Save user
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update user'
    });
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete user'
    });
  }
};

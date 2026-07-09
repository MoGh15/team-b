const express = require('express');
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

/**
 * Get all users
 */
router.get('/', getAllUsers);

/**
 * Get single user
 */
router.get('/:id', getUser);

/**
 * Create new user
 */
router.post('/', createUser);

/**
 * Update user
 */
router.put('/:id', updateUser);

/**
 * Delete user
 */
router.delete('/:id', deleteUser);

module.exports = router;

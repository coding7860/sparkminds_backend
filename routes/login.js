const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { login, register, getProfile, logout } = require('../controllers/loginController');

const router = express.Router();

// Login route
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], login);

// Register route (optional - for creating new users)
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'mentor', 'trainee']).withMessage('Valid role is required'),
  body('first_name').notEmpty().trim().withMessage('First name is required'),
  body('last_name').notEmpty().trim().withMessage('Last name is required')
], register);

// Get current user profile
router.get('/profile', authenticateToken, getProfile);

// Logout route (client-side token removal)
router.post('/logout', authenticateToken, logout);

module.exports = router;

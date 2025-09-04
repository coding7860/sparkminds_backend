const { body, validationResult } = require('express-validator');
const authService = require('../services/auth.service');

class AuthController {
  // Validation rules for registration
  static validateRegistration() {
    return [
      body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters'),
      body('email')
        .isEmail()
        .withMessage('Please provide a valid email address'),
      body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
      body('role')
        .isIn(['admin', 'mentor', 'trainee'])
        .withMessage('Role must be admin, mentor, or trainee'),
      body('first_name')
        .notEmpty()
        .withMessage('First name is required'),
      body('last_name')
        .notEmpty()
        .withMessage('Last name is required')
    ];
  }

  // Validation rules for login
  static validateLogin() {
    return [
      body('username')
        .notEmpty()
        .withMessage('Username or email is required'),
      body('password')
        .notEmpty()
        .withMessage('Password is required')
    ];
  }

  // Validation rules for role-based login
  static validateRoleLogin() {
    return [
      body('email')
        .isEmail()
        .withMessage('Please provide a valid email address'),
      body('password')
        .notEmpty()
        .withMessage('Password is required')
    ];
  }

  // User registration
  static async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const result = await authService.register(req.body);
      
      res.status(201).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // User login
  static async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, password } = req.body;
      const result = await authService.login(username, password);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Role-based login
  static async roleLogin(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;
      const result = await authService.roleLogin(email, password);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user profile
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await authService.getProfile(userId);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Refresh token
  static async refreshToken(req, res, next) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const result = await authService.refreshToken(token);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout
  static async logout(req, res, next) {
    try {
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;

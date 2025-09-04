const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticate, rateLimit, strictAuthGuard } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply rate limiting to auth routes
router.use(rateLimit(15 * 60 * 1000, 10)); // 10 requests per 15 minutes

// Public routes
router.post('/register', AuthController.validateRegistration(), AuthController.register);
router.post('/login', AuthController.validateLogin(), AuthController.login);
router.post('/role-login', AuthController.validateRoleLogin(), AuthController.roleLogin);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes - apply strict authentication guard
router.use('/profile', authenticate, strictAuthGuard);
router.get('/profile', AuthController.getProfile);

router.use('/logout', authenticate, strictAuthGuard);
router.post('/logout', AuthController.logout);

module.exports = router;

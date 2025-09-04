const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const UserController = require('../controllers/user.controller');

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticate);

// ===== USER MANAGEMENT ROUTES =====

// Create a new user (admin only)
router.post('/', async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

  await UserController.createUser(req, res);
});

// Get all users with filtering, search, and pagination (admin only)
router.get('/', async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  
  await UserController.getAllUsers(req, res);
});

// Get user by ID (admin or own profile)
router.get('/:id', async (req, res) => {
    const userId = req.params.id;
    
    // Users can only access their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.userId !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

  await UserController.getUserById(req, res);
});

// Update user (admin or own profile)
router.put('/:id', async (req, res) => {
    const userId = req.params.id;
    
    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.userId !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

  await UserController.updateUser(req, res);
});

// Update user password (admin or own profile)
router.put('/:id/password', async (req, res) => {
  const userId = req.params.id;
  
  // Users can only update their own password unless they're admin
  if (req.user.role !== 'admin' && req.user.userId !== parseInt(userId)) {
    return res.status(403).json({
        success: false,
      message: 'Access denied. You can only update your own password.'
    });
  }
  
  await UserController.updateUserPassword(req, res);
});

// Delete user (admin only)
router.delete('/:id', async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }
    
    // Prevent admin from deleting themselves
  if (req.user.userId === parseInt(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

  await UserController.deleteUser(req, res);
});

// ===== UTILITY ROUTES =====

// Get user statistics (admin only)
router.get('/stats/overview', async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  
  await UserController.getUserStatistics(req, res);
});

// Get available departments (admin only)
router.get('/data/departments', async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  
  await UserController.getDepartments(req, res);
});

// Get available mentors (admin only)
router.get('/data/mentors', async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  
  await UserController.getMentors(req, res);
});

// Get available courses (admin only)
router.get('/data/courses', async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  
  await UserController.getCourses(req, res);
});

// ===== BULK OPERATIONS =====

// Bulk update user status (admin only)
router.put('/bulk/status', async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
        success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  
  await UserController.bulkUpdateStatus(req, res);
});

// Export users (admin only)
router.get('/export/all', async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  
  await UserController.exportUsers(req, res);
});

// ===== FILTERED USER ROUTES =====

// Get users by role (admin only)
router.get('/role/:role', async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const role = req.params.role;
    if (!['admin', 'mentor', 'trainee'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, mentor, or trainee.'
      });
    }

  req.query.role = role;
  await UserController.getAllUsers(req, res);
});

// Get users by department (admin only)
router.get('/department/:department', async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }

  req.query.department = req.params.department;
  await UserController.getAllUsers(req, res);
});

// Get users by status (admin only)
router.get('/status/:status', async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }

  const status = req.params.status;
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be active or inactive.'
    });
  }

  req.query.status = status;
  await UserController.getAllUsers(req, res);
});

// Search users (admin only)
router.get('/search/:query', async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }

  req.query.search = req.params.query;
  await UserController.getAllUsers(req, res);
});

// ===== PROFILE ROUTES =====

// Get current user profile
router.get('/profile/me', async (req, res) => {
  try {
    const userId = req.user.userId;
    req.params.id = userId;
    await UserController.getUserById(req, res);
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// Update current user profile
router.put('/profile/me', async (req, res) => {
  try {
    const userId = req.user.userId;
    req.params.id = userId;
    await UserController.updateUser(req, res);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Update current user password
router.put('/profile/me/password', async (req, res) => {
  try {
    const userId = req.user.userId;
    req.params.id = userId;
    await UserController.updateUserPassword(req, res);
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message
    });
  }
});

module.exports = router;

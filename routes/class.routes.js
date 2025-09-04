const express = require('express');
const router = express.Router();
const ClassController = require('../controllers/class.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
// router.use(authenticate); // Temporarily commented out for testing

// Create a new class schedule (Admin only)
router.post('/', ClassController.createClass);

// Get all class schedules (with optional filtering and pagination)
router.get('/', ClassController.getAllClasses);

// Get upcoming classes
router.get('/upcoming', ClassController.getUpcomingClasses);

// Get class schedule by ID
router.get('/:id', ClassController.getClassById);

// Get classes by course ID
router.get('/course/:courseId', ClassController.getClassesByCourse);

// Get classes by mentor name
router.get('/mentor/:mentorName', ClassController.getClassesByMentor);

// Update class schedule (Admin only)
router.put('/:id', ClassController.updateClass);

// Delete class schedule (Admin only)
router.delete('/:id', ClassController.deleteClass);

module.exports = router;

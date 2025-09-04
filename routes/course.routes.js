const express = require('express');
const CourseController = require('../controllers/course.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply authentication to all course routes
// router.use(authenticate); // Temporarily commented out for testing

// Course routes with authentication (temporarily disabled for testing)
router.post('/', CourseController.createCourse);
router.post('/complete', CourseController.createCompleteCourse);
router.get('/', CourseController.getAllCourses);
router.get('/hierarchy', CourseController.getAllCoursesWithHierarchy);
router.get('/:id', CourseController.getCourseById);
router.get('/:id/hierarchy', CourseController.getCourseWithHierarchy);
router.get('/:id/statistics', CourseController.getCourseStatistics);
router.put('/:id', CourseController.updateCourse);
router.delete('/:id', CourseController.deleteCourse);

// Temporary routes for testing (without authentication)
router.post('/test-create', CourseController.createCourse);
router.get('/test-all', CourseController.getAllCourses);
router.post('/create-simple', CourseController.createSimpleCourse);
router.post('/create-working', CourseController.createSimpleWorkingCourse);
router.get('/all', CourseController.getAllCoursesSimple);
router.put('/update-simple/:id', CourseController.updateSimpleCourse);
router.delete('/delete-simple/:id', CourseController.deleteSimpleCourse);

module.exports = router;

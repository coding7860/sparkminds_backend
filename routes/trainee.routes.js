const express = require('express');
const TraineeController = require('../controllers/trainee.controller');

const router = express.Router();

// ===== TRAINEE MANAGEMENT ROUTES =====

// Create a new trainee (no authentication required for testing)
router.post('/', TraineeController.createTrainee);

// Get all trainees
router.get('/', TraineeController.getAllTrainees);

// Get trainee by ID
router.get('/:id', TraineeController.getTraineeById);

// Update trainee
router.put('/:id', TraineeController.updateTrainee);

// Delete trainee
router.delete('/:id', TraineeController.deleteTrainee);

// Search trainees
router.get('/search/:query', TraineeController.searchTrainees);

// Get trainees by role
router.get('/role/:role', TraineeController.getTraineesByRole);

// Get trainees by department
router.get('/department/:department', TraineeController.getTraineesByDepartment);

// Get trainee statistics
router.get('/stats/overview', TraineeController.getTraineeStatistics);

module.exports = router;

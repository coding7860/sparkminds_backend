const express = require('express');
const SubtopicController = require('../controllers/subtopic.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply authentication to all subtopic routes
router.use(authenticate);

// Subtopic routes
router.post('/', requireRole(['admin', 'mentor']), SubtopicController.createSubtopic);
router.get('/module/:moduleId', SubtopicController.getSubtopicsByModuleId);
router.get('/:id', SubtopicController.getSubtopicById);
router.put('/:id', requireRole(['admin', 'mentor']), SubtopicController.updateSubtopic);
router.delete('/:id', requireRole(['admin', 'mentor']), SubtopicController.deleteSubtopic);
router.post('/module/:moduleId/bulk', requireRole(['admin', 'mentor']), SubtopicController.bulkCreateSubtopics);
router.put('/module/:moduleId/reorder', requireRole(['admin', 'mentor']), SubtopicController.reorderSubtopics);

module.exports = router;

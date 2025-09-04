const express = require('express');
const ModuleController = require('../controllers/module.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply authentication to all module routes
router.use(authenticate);

// Module routes
router.post('/', requireRole(['admin', 'mentor']), ModuleController.createModule);
router.get('/course/:courseId', ModuleController.getModulesByCourseId);
router.get('/:id', ModuleController.getModuleById);
router.put('/:id', requireRole(['admin', 'mentor']), ModuleController.updateModule);
router.delete('/:id', requireRole(['admin', 'mentor']), ModuleController.deleteModule);
router.put('/course/:courseId/reorder', requireRole(['admin', 'mentor']), ModuleController.reorderModules);

module.exports = router;

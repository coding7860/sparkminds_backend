const Module = require('../models/Module.model');

class ModuleController {
  // Create a new module
  static async createModule(req, res) {
    try {
      const { courseId, moduleName, description, durationDays, moduleOrder } = req.body;

      // Validate required fields
      if (!courseId || !moduleName) {
        return res.status(400).json({
          success: false,
          message: 'Course ID and module name are required'
        });
      }

      const moduleData = {
        courseId,
        moduleName,
        description,
        durationDays: durationDays || 0,
        moduleOrder: moduleOrder || 0
      };

      const moduleId = await Module.create(moduleData);
      const newModule = await Module.findById(moduleId);

      res.status(201).json({
        success: true,
        message: 'Module created successfully',
        data: newModule.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get module by ID
  static async getModuleById(req, res) {
    try {
      const { id } = req.params;
      const module = await Module.findByIdWithSubtopics(id);

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      res.status(200).json({
        success: true,
        data: module
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all modules for a course
  static async getModulesByCourseId(req, res) {
    try {
      const { courseId } = req.params;
      const modules = await Module.findByCourseIdWithSubtopics(courseId);

      res.status(200).json({
        success: true,
        data: modules
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update module
  static async updateModule(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate required fields
      if (!updateData.moduleName) {
        return res.status(400).json({
          success: false,
          message: 'Module name is required'
        });
      }

      await Module.update(id, updateData);
      const updatedModule = await Module.findById(id);

      res.status(200).json({
        success: true,
        message: 'Module updated successfully',
        data: updatedModule.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete module
  static async deleteModule(req, res) {
    try {
      const { id } = req.params;
      await Module.delete(id);

      res.status(200).json({
        success: true,
        message: 'Module deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Reorder modules within a course
  static async reorderModules(req, res) {
    try {
      const { courseId } = req.params;
      const { moduleOrders } = req.body; // Array of {id, moduleOrder}

      if (!Array.isArray(moduleOrders)) {
        return res.status(400).json({
          success: false,
          message: 'Module orders must be an array'
        });
      }

      // Update each module's order
      for (const { id, moduleOrder } of moduleOrders) {
        await Module.update(id, { moduleOrder });
      }

      // Get updated modules
      const updatedModules = await Module.findByCourseId(courseId);

      res.status(200).json({
        success: true,
        message: 'Modules reordered successfully',
        data: updatedModules
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ModuleController;

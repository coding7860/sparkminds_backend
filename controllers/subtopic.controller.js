const Subtopic = require('../models/Subtopic.model');

class SubtopicController {
  // Create a new subtopic
  static async createSubtopic(req, res) {
    try {
      const { moduleId, subtopicName, description, durationDays, trainingBy, subtopicOrder } = req.body;

      // Validate required fields
      if (!moduleId || !subtopicName) {
        return res.status(400).json({
          success: false,
          message: 'Module ID and subtopic name are required'
        });
      }

      const subtopicData = {
        moduleId,
        subtopicName,
        description,
        durationDays,
        trainingBy,
        subtopicOrder: subtopicOrder || 0
      };

      const subtopicId = await Subtopic.create(subtopicData);
      const newSubtopic = await Subtopic.findById(subtopicId);

      res.status(201).json({
        success: true,
        message: 'Subtopic created successfully',
        data: newSubtopic.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get subtopic by ID
  static async getSubtopicById(req, res) {
    try {
      const { id } = req.params;
      const subtopic = await Subtopic.findByIdWithDetails(id);

      if (!subtopic) {
        return res.status(404).json({
          success: false,
          message: 'Subtopic not found'
        });
      }

      res.status(200).json({
        success: true,
        data: subtopic
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all subtopics for a module
  static async getSubtopicsByModuleId(req, res) {
    try {
      const { moduleId } = req.params;
      const subtopics = await Subtopic.findByModuleId(moduleId);

      res.status(200).json({
        success: true,
        data: subtopics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update subtopic
  static async updateSubtopic(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate required fields
      if (!updateData.subtopicName) {
        return res.status(400).json({
          success: false,
          message: 'Subtopic name is required'
        });
      }

      await Subtopic.update(id, updateData);
      const updatedSubtopic = await Subtopic.findById(id);

      res.status(200).json({
        success: true,
        message: 'Subtopic updated successfully',
        data: updatedSubtopic.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete subtopic
  static async deleteSubtopic(req, res) {
    try {
      const { id } = req.params;
      await Subtopic.delete(id);

      res.status(200).json({
        success: true,
        message: 'Subtopic deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Bulk create subtopics for a module
  static async bulkCreateSubtopics(req, res) {
    try {
      const { moduleId } = req.params;
      const { subtopics } = req.body; // Array of subtopic objects

      if (!Array.isArray(subtopics) || subtopics.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Subtopics must be a non-empty array'
        });
      }

      // Validate each subtopic
      for (const subtopic of subtopics) {
        if (!subtopic.subtopicName) {
          return res.status(400).json({
            success: false,
            message: 'Subtopic name is required for all subtopics'
          });
        }
      }

      const subtopicIds = await Subtopic.bulkCreate(moduleId, subtopics);
      const createdSubtopics = await Subtopic.findByModuleId(moduleId);

      res.status(201).json({
        success: true,
        message: `${subtopics.length} subtopics created successfully`,
        data: createdSubtopics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Reorder subtopics within a module
  static async reorderSubtopics(req, res) {
    try {
      const { moduleId } = req.params;
      const { subtopicOrders } = req.body; // Array of {id, subtopicOrder}

      if (!Array.isArray(subtopicOrders)) {
        return res.status(400).json({
          success: false,
          message: 'Subtopic orders must be an array'
        });
      }

      await Subtopic.reorder(moduleId, subtopicOrders);

      // Get updated subtopics
      const updatedSubtopics = await Subtopic.findByModuleId(moduleId);

      res.status(200).json({
        success: true,
        message: 'Subtopics reordered successfully',
        data: updatedSubtopics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = SubtopicController;

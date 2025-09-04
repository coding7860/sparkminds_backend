const ClassSchedule = require('../models/ClassSchedule.model');

class ClassController {
  // Create a new class schedule
  static async createClass(req, res) {
    try {
      const {
        class_title,
        description,
        course_id,
        mentor_name,
        class_date,
        class_time,
        duration,
        class_type,
        max_trainees,
        meeting_link
      } = req.body;

      // Validation
      if (!class_title || !description || !mentor_name || !class_date || !class_time) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: class_title, description, mentor_name, class_date, class_time'
        });
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(class_date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      // Validate time format (HH:MM:SS)
      const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
      if (!timeRegex.test(class_time)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time format. Use HH:MM:SS'
        });
      }

      // Check if class date is in the past
      const classDateTime = new Date(`${class_date} ${class_time}`);
      if (classDateTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Class date and time must be in the future'
        });
      }

      const classData = {
        class_title,
        description,
        course_id: course_id || null,
        mentor_name,
        class_date,
        class_time,
        duration: duration || '2 hours',
        class_type: class_type || 'Virtual',
        max_trainees: max_trainees || 25,
        meeting_link: meeting_link || null
      };

      // Create class directly without Teams integration
      const classId = await ClassSchedule.create(classData);
      const newClass = await ClassSchedule.findById(classId);

      res.status(201).json({
        success: true,
        message: 'Class schedule created successfully',
        data: newClass
      });
    } catch (error) {
      console.error('Error creating class schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create class schedule',
        error: error.message
      });
    }
  }

  // Get all class schedules
  static async getAllClasses(req, res) {
    try {
      const { page = 1, limit = 10, course_id, mentor_name, upcoming } = req.query;
      
      let classes;
      
      if (upcoming === 'true') {
        classes = await ClassSchedule.findUpcoming();
      } else if (course_id) {
        classes = await ClassSchedule.findByCourseId(course_id);
      } else if (mentor_name) {
        classes = await ClassSchedule.findByMentor(mentor_name);
      } else {
        classes = await ClassSchedule.findAll();
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedClasses = classes.slice(startIndex, endIndex);

      const totalPages = Math.ceil(classes.length / limit);

      res.status(200).json({
        success: true,
        message: 'Classes retrieved successfully',
        data: {
          classes: paginatedClasses,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalClasses: classes.length,
            hasNextPage: endIndex < classes.length,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Error retrieving classes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve classes',
        error: error.message
      });
    }
  }

  // Get class schedule by ID
  static async getClassById(req, res) {
    try {
      const { id } = req.params;
      
      const classSchedule = await ClassSchedule.findById(id);
      
      if (!classSchedule) {
        return res.status(404).json({
          success: false,
          message: 'Class schedule not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Class schedule retrieved successfully',
        data: classSchedule
      });
    } catch (error) {
      console.error('Error retrieving class schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve class schedule',
        error: error.message
      });
    }
  }

  // Update class schedule
  static async updateClass(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const classSchedule = await ClassSchedule.findById(id);
      
      if (!classSchedule) {
        return res.status(404).json({
          success: false,
          message: 'Class schedule not found'
        });
      }

      // Validation for date and time if provided
      if (updateData.class_date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(updateData.class_date)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid date format. Use YYYY-MM-DD'
          });
        }
      }

      if (updateData.class_time) {
        const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
        if (!timeRegex.test(updateData.class_time)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid time format. Use HH:MM:SS'
          });
        }
      }

      // Check if updated date/time is in the past
      if (updateData.class_date || updateData.class_time) {
        const classDate = updateData.class_date || classSchedule.class_date;
        const classTime = updateData.class_time || classSchedule.class_time;
        const classDateTime = new Date(`${classDate} ${classTime}`);
        
        if (classDateTime <= new Date()) {
          return res.status(400).json({
            success: false,
            message: 'Class date and time must be in the future'
          });
        }
      }

      // Update class directly without Teams integration
      const updated = await classSchedule.update(updateData);
      
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update class schedule'
        });
      }

      const updatedClass = await ClassSchedule.findById(id);

      res.status(200).json({
        success: true,
        message: 'Class schedule updated successfully',
        data: updatedClass
      });
    } catch (error) {
      console.error('Error updating class schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update class schedule',
        error: error.message
      });
    }
  }

  // Delete class schedule
  static async deleteClass(req, res) {
    try {
      const { id } = req.params;
      
      const classSchedule = await ClassSchedule.findById(id);
      
      if (!classSchedule) {
        return res.status(404).json({
          success: false,
          message: 'Class schedule not found'
        });
      }

      // Delete class directly without Teams integration
      const deleted = await classSchedule.delete();
      
      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete class schedule'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Class schedule deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting class schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete class schedule',
        error: error.message
      });
    }
  }

  // Get upcoming classes
  static async getUpcomingClasses(req, res) {
    try {
      const classes = await ClassSchedule.findUpcoming();
      
      res.status(200).json({
        success: true,
        message: 'Upcoming classes retrieved successfully',
        data: classes
      });
    } catch (error) {
      console.error('Error retrieving upcoming classes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve upcoming classes',
        error: error.message
      });
    }
  }

  // Get classes by course
  static async getClassesByCourse(req, res) {
    try {
      const { courseId } = req.params;
      
      const classes = await ClassSchedule.findByCourseId(courseId);
      
      res.status(200).json({
        success: true,
        message: 'Classes by course retrieved successfully',
        data: classes
      });
    } catch (error) {
      console.error('Error retrieving classes by course:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve classes by course',
        error: error.message
      });
    }
  }

  // Get classes by mentor
  static async getClassesByMentor(req, res) {
    try {
      const { mentorName } = req.params;
      
      const classes = await ClassSchedule.findByMentor(mentorName);
      
      res.status(200).json({
        success: true,
        message: 'Classes by mentor retrieved successfully',
        data: classes
      });
    } catch (error) {
      console.error('Error retrieving classes by mentor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve classes by mentor',
        error: error.message
      });
    }
  }
}

module.exports = ClassController;

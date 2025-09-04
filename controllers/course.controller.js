const Course = require('../models/Course.model');

class CourseController {
  // Create a new course
  static async createCourse(req, res) {
    try {
      const { courseName, description, department, mentorName, courseTemplate, courseDuration } = req.body;

      // Validation
      if (!courseName || !description || !department || !mentorName || !courseDuration) {
        return res.status(400).json({
          success: false,
          message: 'Course name, description, department, mentor name, and duration are required'
        });
      }

      // Create course data object
      const courseData = {
        courseName: courseName.trim(),
        description: description.trim(),
        department: department.trim(),
        mentorName: mentorName.trim(),
        courseTemplate: courseTemplate ? courseTemplate.trim() : null,
        courseDuration: courseDuration.trim()
      };

      // Create the course using the Course model
      const courseId = await Course.create(courseData);
      const newCourse = await Course.findById(courseId);

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: newCourse
      });

    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create course',
        error: error.message
      });
    }
  }

  // Get all courses with modules and subtopics
  static async getAllCourses(req, res) {
    try {
      const { pool } = require('../config/database');
      
      // Get all courses
      const [courseRows] = await pool.execute('SELECT * FROM courses ORDER BY created_at DESC');
      
      // For each course, get its modules and subtopics
      const coursesWithModules = [];
      
      for (const course of courseRows) {
        // Get modules for this course
        const [moduleRows] = await pool.execute(
          'SELECT * FROM course_modules WHERE course_id = ? ORDER BY module_order',
          [course.id]
        );
        
        const courseWithModules = {
          id: course.id,
          courseName: course.course_name,
          description: course.description,
          department: course.department,
          mentorName: course.mentor_name,
          courseTemplate: course.course_template,
          courseDuration: course.course_duration,
          createdAt: course.created_at,
          updatedAt: course.updated_at,
          modules: []
        };
        
        // Get subtopics for each module
        for (const module of moduleRows) {
          const [subtopicRows] = await pool.execute(
            'SELECT * FROM course_subtopics WHERE module_id = ? ORDER BY subtopic_order',
            [module.id]
          );
          
          courseWithModules.modules.push({
            id: module.id,
            moduleName: module.module_name,
            description: module.description,
            durationDays: module.duration_days,
            moduleOrder: module.module_order,
            subtopics: subtopicRows.map(subtopic => ({
              id: subtopic.id,
              subtopicName: subtopic.subtopic_name,
              description: subtopic.description,
              durationDays: subtopic.duration_days,
              trainingBy: subtopic.training_by,
              subtopicOrder: subtopic.subtopic_order
            }))
          });
        }
        
        coursesWithModules.push(courseWithModules);
      }

      res.status(200).json({
        success: true,
        message: 'Courses with modules and subtopics retrieved successfully',
        data: coursesWithModules
      });

    } catch (error) {
      console.error('Error getting courses with modules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve courses',
        error: error.message
      });
    }
  }

  // Get course by ID
  static async getCourseById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid course ID is required'
        });
      }

      const course = await Course.findById(parseInt(id));

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Course retrieved successfully',
        data: course
      });

    } catch (error) {
      console.error('Error getting course:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve course',
        error: error.message
      });
    }
  }

  // Update course
  static async updateCourse(req, res) {
    try {
      const { id } = req.params;
      const { courseName, description, department, mentorName, courseTemplate, courseDuration } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid course ID is required'
        });
      }

      // Validation
      if (!courseName || !description || !department || !mentorName || !courseDuration) {
        return res.status(400).json({
          success: false,
          message: 'Course name, description, department, mentor name, and duration are required'
        });
      }

      // Check if course exists
      const existingCourse = await Course.findById(parseInt(id));
      if (!existingCourse) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Update course data object
      const courseData = {
        courseName: courseName.trim(),
        description: description.trim(),
        department: department.trim(),
        mentorName: mentorName.trim(),
        courseTemplate: courseTemplate ? courseTemplate.trim() : null,
        courseDuration: courseDuration.trim()
      };

      // Update the course using the Course model
      await Course.update(parseInt(id), courseData);
      const updatedCourse = await Course.findById(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        data: updatedCourse
      });

    } catch (error) {
      console.error('Error updating course:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update course',
        error: error.message
      });
    }
  }

  // Delete course
  static async deleteCourse(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid course ID is required'
        });
      }

      // Check if course exists
      const existingCourse = await Course.findById(parseInt(id));
      if (!existingCourse) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Delete the course directly
      await Course.delete(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting course:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete course',
        error: error.message
      });
    }
  }

  // Get courses by department
  static async getCoursesByDepartment(req, res) {
    try {
      const { department } = req.params;

      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department parameter is required'
        });
      }

      const courses = await Course.findByDepartment(department);

      res.status(200).json({
        success: true,
        message: 'Courses retrieved successfully',
        data: courses
      });

    } catch (error) {
      console.error('Error getting courses by department:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve courses by department',
        error: error.message
      });
    }
  }

  // Get courses by mentor
  static async getCoursesByMentor(req, res) {
    try {
      const { mentorName } = req.params;

      if (!mentorName) {
        return res.status(400).json({
          success: false,
          message: 'Mentor name parameter is required'
        });
      }

      const courses = await Course.findByMentor(mentorName);

      res.status(200).json({
        success: true,
        message: 'Courses retrieved successfully',
        data: courses
      });

    } catch (error) {
      console.error('Error getting courses by mentor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve courses by mentor',
        error: error.message
      });
    }
  }

  // Get course with full hierarchy (modules and subtopics)
  static async getCourseWithHierarchy(req, res) {
    try {
      const { id } = req.params;
      const course = await Course.findByIdWithHierarchy(id);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      res.status(200).json({
        success: true,
        data: course
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all courses with full hierarchy
  static async getAllCoursesWithHierarchy(req, res) {
    try {
      const courses = await Course.findAllWithHierarchy();

      res.status(200).json({
        success: true,
        data: courses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get course statistics
  static async getCourseStatistics(req, res) {
    try {
      const { id } = req.params;
      const stats = await Course.getStatistics(id);

      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Simple course creation for testing (without authentication)
  static async createSimpleCourse(req, res) {
    try {
      const { courseName, description, department, mentorName, courseDuration } = req.body;
      
      console.log('Received course data:', req.body);
      
      if (!courseName || !description || !department || !mentorName || !courseDuration) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
          received: req.body
        });
      }

      const { pool } = require('../config/database');
      
      // Insert the course
      const [result] = await pool.execute(
        'INSERT INTO courses (course_name, description, department, mentor_name, course_duration) VALUES (?, ?, ?, ?, ?)',
        [courseName, description, department, mentorName, courseDuration]
      );

      console.log('Course inserted with ID:', result.insertId);

      // Fetch the created course
      const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [result.insertId]);

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: rows[0]
      });
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get all courses simple (for testing)
  static async getAllCoursesSimple(req, res) {
    try {
      const { pool } = require('../config/database');
      const [rows] = await pool.execute('SELECT * FROM courses ORDER BY created_at DESC');
      
      // Parse modules data if it exists
      const coursesWithModules = rows.map(course => ({
        ...course,
        modules: course.modules_data ? JSON.parse(course.modules_data) : []
      }));
      
      res.status(200).json({
        success: true,
        message: 'Courses retrieved successfully',
        data: coursesWithModules
      });
    } catch (error) {
      console.error('Error getting courses:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update course simple (for testing)
  static async updateSimpleCourse(req, res) {
    try {
      const { id } = req.params;
      const { courseName, description, department, mentorName, courseDuration } = req.body;
      
      if (!courseName || !description || !department || !mentorName || !courseDuration) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      const { pool } = require('../config/database');
      
      // Update the course
      const [result] = await pool.execute(
        'UPDATE courses SET course_name = ?, description = ?, department = ?, mentor_name = ?, course_duration = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [courseName, description, department, mentorName, courseDuration, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Fetch the updated course
      const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [id]);

      res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        data: rows[0]
      });
    } catch (error) {
      console.error('Error updating course:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Delete course simple (for testing)
  static async deleteSimpleCourse(req, res) {
    try {
      const { id } = req.params;
      const { pool } = require('../config/database');
      
      // Delete the course
      const [result] = await pool.execute('DELETE FROM courses WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Create complete course with modules and subtopics
  static async createCompleteCourse(req, res) {
    try {
      const { 
        courseName, 
        description, 
        department, 
        mentorName, 
        courseTemplate, 
        courseDuration,
        modules 
      } = req.body;

      // Validate required fields
      if (!courseName || !description || !department || !mentorName || !courseDuration) {
        return res.status(400).json({
          success: false,
          message: 'Course name, description, department, mentor name, and course duration are required'
        });
      }

      if (!Array.isArray(modules) || modules.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one module is required'
        });
      }

      const { pool } = require('../config/database');

      // Start transaction
      await pool.execute('START TRANSACTION');

      try {
        // 1. Create the course
        const [courseResult] = await pool.execute(`
          INSERT INTO courses (course_name, description, department, mentor_name, course_template, course_duration) 
          VALUES (?, ?, ?, ?, ?, ?)
        `, [courseName, description, department, mentorName, courseTemplate || null, courseDuration]);

        const courseId = courseResult.insertId;
        console.log(`✅ Course created with ID: ${courseId}`);

        // 2. Create modules and subtopics
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];
          
          if (!module.moduleName || !module.description || !module.durationDays) {
            throw new Error(`Module ${i + 1} is missing required fields (moduleName, description, durationDays)`);
          }

          // Create module
          const [moduleResult] = await pool.execute(`
            INSERT INTO course_modules (course_id, module_name, description, duration_days, module_order) 
            VALUES (?, ?, ?, ?, ?)
          `, [courseId, module.moduleName, module.description, module.durationDays, i + 1]);

          const moduleId = moduleResult.insertId;
          console.log(`✅ Module "${module.moduleName}" created with ID: ${moduleId}`);

          // Create subtopics for this module
          if (module.subtopics && Array.isArray(module.subtopics)) {
            for (let j = 0; j < module.subtopics.length; j++) {
              const subtopic = module.subtopics[j];
              
              if (!subtopic.subtopicName || !subtopic.description || !subtopic.durationDays) {
                throw new Error(`Subtopic ${j + 1} in module "${module.moduleName}" is missing required fields`);
              }

              await pool.execute(`
                INSERT INTO course_subtopics (module_id, subtopic_name, description, duration_days, training_by, subtopic_order) 
                VALUES (?, ?, ?, ?, ?, ?)
              `, [moduleId, subtopic.subtopicName, subtopic.description, subtopic.durationDays, subtopic.trainingBy || mentorName, j + 1]);
            }
            console.log(`✅ Added ${module.subtopics.length} subtopics to module "${module.moduleName}"`);
          }
        }

        // Commit transaction
        await pool.execute('COMMIT');

        // Fetch the complete course with hierarchy
        const completeCourse = await Course.findByIdWithHierarchy(courseId);

        res.status(201).json({
          success: true,
          message: 'Complete course created successfully',
          data: completeCourse
        });

      } catch (error) {
        // Rollback transaction on error
        await pool.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Error creating complete course:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create complete course with modules and subtopics (working version)
  static async createSimpleWorkingCourse(req, res) {
    try {
      const { 
        courseName, 
        description, 
        department, 
        mentorName, 
        courseTemplate, 
        courseDuration,
        modules 
      } = req.body;

      console.log('Received course data:', req.body);

      // Validate required fields
      if (!courseName || !description || !department || !mentorName || !courseDuration) {
        return res.status(400).json({
          success: false,
          message: 'Course name, description, department, mentor name, and course duration are required'
        });
      }

      if (!Array.isArray(modules) || modules.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one module is required'
        });
      }

      const { pool } = require('../config/database');

      // Start transaction - use query instead of execute for transaction commands
      await pool.query('START TRANSACTION');

      try {
        // 1. Create the course
        const [courseResult] = await pool.execute(
          'INSERT INTO courses (course_name, description, department, mentor_name, course_template, course_duration, modules_data) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [courseName, description, department, mentorName, courseTemplate || null, courseDuration, JSON.stringify(modules || [])]
        );

        const courseId = courseResult.insertId;
        console.log(`✅ Course created with ID: ${courseId}`);

        // 2. Create modules and subtopics
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];
          
          if (!module.moduleName || !module.description || !module.durationDays) {
            throw new Error(`Module ${i + 1} is missing required fields (moduleName, description, durationDays)`);
          }

          // Create module
          const [moduleResult] = await pool.execute(
            'INSERT INTO course_modules (course_id, module_name, description, duration_days, module_order) VALUES (?, ?, ?, ?, ?)',
            [courseId, module.moduleName, module.description, module.durationDays, i + 1]
          );

          const moduleId = moduleResult.insertId;
          console.log(`✅ Module "${module.moduleName}" created with ID: ${moduleId}`);

          // Create subtopics for this module
          if (module.subtopics && Array.isArray(module.subtopics)) {
            for (let j = 0; j < module.subtopics.length; j++) {
              const subtopic = module.subtopics[j];
              
              if (!subtopic.subtopicName || !subtopic.description || !subtopic.durationDays) {
                throw new Error(`Subtopic ${j + 1} in module "${module.moduleName}" is missing required fields`);
              }

              await pool.execute(
                'INSERT INTO course_subtopics (module_id, subtopic_name, description, duration_days, training_by, subtopic_order) VALUES (?, ?, ?, ?, ?, ?)',
                [moduleId, subtopic.subtopicName, subtopic.description, subtopic.durationDays, subtopic.trainingBy || mentorName, j + 1]
              );
            }
            console.log(`✅ Added ${module.subtopics.length} subtopics to module "${module.moduleName}"`);
          }
        }

        // Commit transaction
        await pool.query('COMMIT');

        // Fetch the complete course with hierarchy
        const [courseRows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [courseId]);
        const [moduleRows] = await pool.execute('SELECT * FROM course_modules WHERE course_id = ? ORDER BY module_order', [courseId]);
        
        // Build the complete course structure
        const completeCourse = {
          id: courseRows[0].id,
          courseName: courseRows[0].course_name,
          description: courseRows[0].description,
          department: courseRows[0].department,
          mentorName: courseRows[0].mentor_name,
          courseTemplate: courseRows[0].course_template,
          courseDuration: courseRows[0].course_duration,
          createdAt: courseRows[0].created_at,
          updatedAt: courseRows[0].updated_at,
          modules: []
        };

        // Add modules with subtopics
        for (const moduleRow of moduleRows) {
          const [subtopicRows] = await pool.execute('SELECT * FROM course_subtopics WHERE module_id = ? ORDER BY subtopic_order', [moduleRow.id]);
          
          completeCourse.modules.push({
            id: moduleRow.id,
            moduleName: moduleRow.module_name,
            description: moduleRow.description,
            durationDays: moduleRow.duration_days,
            moduleOrder: moduleRow.module_order,
            subtopics: subtopicRows.map(subtopic => ({
              id: subtopic.id,
              subtopicName: subtopic.subtopic_name,
              description: subtopic.description,
              durationDays: subtopic.duration_days,
              trainingBy: subtopic.training_by,
              subtopicOrder: subtopic.subtopic_order
            }))
          });
        }

        res.status(201).json({
          success: true,
          message: 'Complete course with modules and subtopics created successfully',
          data: completeCourse
        });

      } catch (error) {
        // Rollback transaction on error
        await pool.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Error creating complete course:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = CourseController;

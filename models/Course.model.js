const { pool } = require('../config/database');

class Course {
  constructor(data) {
    this.id = data.id;
    this.courseName = data.course_name;
    this.description = data.description;
    this.department = data.department;
    this.mentorName = data.mentor_name;
    this.courseTemplate = data.course_template;
    this.courseDuration = data.course_duration;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  toJSON() {
    return {
      id: this.id,
      courseName: this.courseName,
      description: this.description,
      department: this.department,
      mentorName: this.mentorName,
      courseTemplate: this.courseTemplate,
      courseDuration: this.courseDuration,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create a new course
  static async create(courseData) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO courses (course_name, description, department, mentor_name, course_template, course_duration) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        courseData.courseName,
        courseData.description,
        courseData.department,
        courseData.mentorName,
        courseData.courseTemplate || null,
        courseData.courseDuration
      ]);

      return result.insertId;
    } catch (error) {
      throw new Error(`Failed to create course: ${error.message}`);
    }
  }

  // Find course by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [id]);
      if (rows.length === 0) {
        return null;
      }
      return new Course(rows[0]);
    } catch (error) {
      throw new Error(`Failed to find course: ${error.message}`);
    }
  }

  // Get all courses
  static async findAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM courses ORDER BY created_at DESC');
      return rows.map(row => new Course(row));
    } catch (error) {
      throw new Error(`Failed to find courses: ${error.message}`);
    }
  }

  // Update course
  static async update(id, updateData) {
    try {
      const [result] = await pool.execute(`
        UPDATE courses 
        SET course_name = ?, description = ?, department = ?, mentor_name = ?, 
            course_template = ?, course_duration = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        updateData.courseName,
        updateData.description,
        updateData.department,
        updateData.mentorName,
        updateData.courseTemplate || null,
        updateData.courseDuration,
        id
      ]);

      if (result.affectedRows === 0) {
        throw new Error('Course not found');
      }

      return result.affectedRows;
    } catch (error) {
      throw new Error(`Failed to update course: ${error.message}`);
    }
  }

  // Delete course
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM courses WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Course not found');
      }

      return result.affectedRows;
    } catch (error) {
      throw new Error(`Failed to delete course: ${error.message}`);
    }
  }

  // Find course by ID with modules and subtopics
  static async findByIdWithHierarchy(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT c.*, 
               cm.id as module_id, cm.module_name, cm.description as module_description,
               cm.duration_days, cm.module_order, cm.created_at as module_created_at, cm.updated_at as module_updated_at,
               cs.id as subtopic_id, cs.subtopic_name, cs.description as subtopic_description,
               cs.duration_days as subtopic_duration, cs.training_by, cs.subtopic_order, 
               cs.created_at as subtopic_created_at, cs.updated_at as subtopic_updated_at
        FROM courses c
        LEFT JOIN course_modules cm ON c.id = cm.course_id
        LEFT JOIN course_subtopics cs ON cm.id = cs.module_id
        WHERE c.id = ?
        ORDER BY cm.module_order ASC, cs.subtopic_order ASC
      `, [id]);

      if (rows.length === 0) {
        return null;
      }

      const course = new Course(rows[0]);
      course.modules = [];

      let currentModule = null;

      rows.forEach(row => {
        if (row.module_id && (!currentModule || currentModule.id !== row.module_id)) {
          currentModule = {
            id: row.module_id,
            moduleName: row.module_name,
            description: row.module_description,
            durationDays: row.duration_days,
            moduleOrder: row.module_order,
            createdAt: row.module_created_at,
            updatedAt: row.module_updated_at,
            subtopics: []
          };
          course.modules.push(currentModule);
        }

        if (row.subtopic_id && currentModule) {
          currentModule.subtopics.push({
            id: row.subtopic_id,
            subtopicName: row.subtopic_name,
            description: row.subtopic_description,
            durationDays: row.subtopic_duration,
            trainingBy: row.training_by,
            subtopicOrder: row.subtopic_order,
            createdAt: row.subtopic_created_at,
            updatedAt: row.subtopic_updated_at
          });
        }
      });

      return course;
    } catch (error) {
      throw new Error(`Failed to find course with hierarchy: ${error.message}`);
    }
  }

  // Get all courses with modules and subtopics
  static async findAllWithHierarchy() {
    try {
      const [rows] = await pool.execute(`
        SELECT c.*, 
               cm.id as module_id, cm.module_name, cm.description as module_description,
               cm.duration_days, cm.module_order, cm.created_at as module_created_at, cm.updated_at as module_updated_at,
               cs.id as subtopic_id, cs.subtopic_name, cs.description as subtopic_description,
               cs.duration_days as subtopic_duration, cs.training_by, cs.subtopic_order, 
               cs.created_at as subtopic_created_at, cs.updated_at as subtopic_updated_at
        FROM courses c
        LEFT JOIN course_modules cm ON c.id = cm.course_id
        LEFT JOIN course_subtopics cs ON cm.id = cs.module_id
        ORDER BY c.id, cm.module_order ASC, cs.subtopic_order ASC
      `);

      const courses = [];
      let currentCourse = null;
      let currentModule = null;

      rows.forEach(row => {
        if (!currentCourse || currentCourse.id !== row.id) {
          currentCourse = new Course(row);
          currentCourse.modules = [];
          courses.push(currentCourse);
          currentModule = null;
        }

        if (row.module_id && (!currentModule || currentModule.id !== row.module_id)) {
          currentModule = {
            id: row.module_id,
            moduleName: row.module_name,
            description: row.module_description,
            durationDays: row.duration_days,
            moduleOrder: row.module_order,
            createdAt: row.module_created_at,
            updatedAt: row.module_updated_at,
            subtopics: []
          };
          currentCourse.modules.push(currentModule);
        }

        if (row.subtopic_id && currentModule) {
          currentModule.subtopics.push({
            id: row.subtopic_id,
            subtopicName: row.subtopic_name,
            description: row.subtopic_description,
            durationDays: row.subtopic_duration,
            trainingBy: row.training_by,
            subtopicOrder: row.subtopic_order,
            createdAt: row.subtopic_created_at,
            updatedAt: row.subtopic_updated_at
          });
        }
      });

      return courses;
    } catch (error) {
      throw new Error(`Failed to find all courses with hierarchy: ${error.message}`);
    }
  }

  // Get course statistics
  static async getStatistics(id) {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          c.id,
          c.course_name,
          COUNT(DISTINCT cm.id) as module_count,
          COUNT(DISTINCT cs.id) as subtopic_count,
          SUM(cm.duration_days) as total_duration
        FROM courses c
        LEFT JOIN course_modules cm ON c.id = cm.course_id
        LEFT JOIN course_subtopics cs ON cm.id = cs.module_id
        WHERE c.id = ?
        GROUP BY c.id, c.course_name
      `, [id]);

      return stats[0] || null;
    } catch (error) {
      throw new Error(`Failed to get course statistics: ${error.message}`);
    }
  }
}

module.exports = Course;

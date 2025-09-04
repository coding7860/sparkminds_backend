const { pool } = require('../config/database');

class Module {
  constructor(data) {
    this.id = data.id;
    this.courseId = data.course_id;
    this.moduleName = data.module_name;
    this.description = data.description;
    this.durationDays = data.duration_days;
    this.moduleOrder = data.module_order;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  toJSON() {
    return {
      id: this.id,
      courseId: this.courseId,
      moduleName: this.moduleName,
      description: this.description,
      durationDays: this.durationDays,
      moduleOrder: this.moduleOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create a new module
  static async create(moduleData) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO course_modules (course_id, module_name, description, duration_days, module_order) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        moduleData.courseId,
        moduleData.moduleName,
        moduleData.description,
        moduleData.durationDays || 0,
        moduleData.moduleOrder || 0
      ]);

      return result.insertId;
    } catch (error) {
      throw new Error(`Failed to create module: ${error.message}`);
    }
  }

  // Find module by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM course_modules WHERE id = ?', [id]);
      if (rows.length === 0) {
        return null;
      }
      return new Module(rows[0]);
    } catch (error) {
      throw new Error(`Failed to find module: ${error.message}`);
    }
  }

  // Find all modules for a course
  static async findByCourseId(courseId) {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM course_modules 
        WHERE course_id = ? 
        ORDER BY module_order ASC
      `, [courseId]);
      
      return rows.map(row => new Module(row));
    } catch (error) {
      throw new Error(`Failed to find modules for course: ${error.message}`);
    }
  }

  // Update module
  static async update(id, updateData) {
    try {
      const [result] = await pool.execute(`
        UPDATE course_modules 
        SET module_name = ?, description = ?, duration_days = ?, module_order = ?
        WHERE id = ?
      `, [
        updateData.moduleName,
        updateData.description,
        updateData.durationDays || 0,
        updateData.moduleOrder || 0,
        id
      ]);

      if (result.affectedRows === 0) {
        throw new Error('Module not found');
      }

      return result.affectedRows;
    } catch (error) {
      throw new Error(`Failed to update module: ${error.message}`);
    }
  }

  // Delete module
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM course_modules WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Module not found');
      }

      return result.affectedRows;
    } catch (error) {
      throw new Error(`Failed to delete module: ${error.message}`);
    }
  }

  // Get module with subtopics
  static async findByIdWithSubtopics(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT cm.*, 
               cs.id as subtopic_id, cs.subtopic_name, cs.description as subtopic_description,
               cs.duration_days as subtopic_duration, cs.training_by, cs.subtopic_order
        FROM course_modules cm
        LEFT JOIN course_subtopics cs ON cm.id = cs.module_id
        WHERE cm.id = ?
        ORDER BY cs.subtopic_order ASC
      `, [id]);

      if (rows.length === 0) {
        return null;
      }

      const module = new Module(rows[0]);
      module.subtopics = [];

      rows.forEach(row => {
        if (row.subtopic_id) {
          module.subtopics.push({
            id: row.subtopic_id,
            subtopicName: row.subtopic_name,
            description: row.subtopic_description,
            durationDays: row.subtopic_duration,
            trainingBy: row.training_by,
            subtopicOrder: row.subtopic_order
          });
        }
      });

      return module;
    } catch (error) {
      throw new Error(`Failed to find module with subtopics: ${error.message}`);
    }
  }

  // Get all modules with subtopics for a course
  static async findByCourseIdWithSubtopics(courseId) {
    try {
      const [rows] = await pool.execute(`
        SELECT cm.*, 
               cs.id as subtopic_id, cs.subtopic_name, cs.description as subtopic_description,
               cs.duration_days as subtopic_duration, cs.training_by, cs.subtopic_order
        FROM course_modules cm
        LEFT JOIN course_subtopics cs ON cm.id = cs.module_id
        WHERE cm.course_id = ?
        ORDER BY cm.module_order ASC, cs.subtopic_order ASC
      `, [courseId]);

      const modules = [];
      let currentModule = null;

      rows.forEach(row => {
        if (!currentModule || currentModule.id !== row.id) {
          currentModule = new Module(row);
          currentModule.subtopics = [];
          modules.push(currentModule);
        }

        if (row.subtopic_id) {
          currentModule.subtopics.push({
            id: row.subtopic_id,
            subtopicName: row.subtopic_name,
            description: row.subtopic_description,
            durationDays: row.subtopic_duration,
            trainingBy: row.training_by,
            subtopicOrder: row.subtopic_order
          });
        }
      });

      return modules;
    } catch (error) {
      throw new Error(`Failed to find modules with subtopics for course: ${error.message}`);
    }
  }
}

module.exports = Module;

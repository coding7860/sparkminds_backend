const { pool } = require('../config/database');

class Subtopic {
  constructor(data) {
    this.id = data.id;
    this.moduleId = data.module_id;
    this.subtopicName = data.subtopic_name;
    this.description = data.description;
    this.durationDays = data.duration_days;
    this.trainingBy = data.training_by;
    this.subtopicOrder = data.subtopic_order;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  toJSON() {
    return {
      id: this.id,
      moduleId: this.moduleId,
      subtopicName: this.subtopicName,
      description: this.description,
      durationDays: this.durationDays,
      trainingBy: this.trainingBy,
      subtopicOrder: this.subtopicOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create a new subtopic
  static async create(subtopicData) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO course_subtopics (module_id, subtopic_name, description, duration_days, training_by, subtopic_order) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        subtopicData.moduleId,
        subtopicData.subtopicName,
        subtopicData.description,
        subtopicData.durationDays || 0,
        subtopicData.trainingBy || null,
        subtopicData.subtopicOrder || 0
      ]);

      return result.insertId;
    } catch (error) {
      throw new Error(`Failed to create subtopic: ${error.message}`);
    }
  }

  // Find subtopic by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM course_subtopics WHERE id = ?', [id]);
      if (rows.length === 0) {
        return null;
      }
      return new Subtopic(rows[0]);
    } catch (error) {
      throw new Error(`Failed to find subtopic: ${error.message}`);
    }
  }

  // Find all subtopics for a module
  static async findByModuleId(moduleId) {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM course_subtopics 
        WHERE module_id = ? 
        ORDER BY subtopic_order ASC
      `, [moduleId]);
      
      return rows.map(row => new Subtopic(row));
    } catch (error) {
      throw new Error(`Failed to find subtopics for module: ${error.message}`);
    }
  }

  // Find subtopic with module and course information
  static async findByIdWithDetails(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT cs.*, cm.module_name, cm.course_id, c.course_name
        FROM course_subtopics cs
        JOIN course_modules cm ON cs.module_id = cm.id
        JOIN courses c ON cm.course_id = c.id
        WHERE cs.id = ?
      `, [id]);

      if (rows.length === 0) {
        return null;
      }

      const subtopic = new Subtopic(rows[0]);
      subtopic.moduleName = rows[0].module_name;
      subtopic.courseId = rows[0].course_id;
      subtopic.courseName = rows[0].course_name;

      return subtopic;
    } catch (error) {
      throw new Error(`Failed to find subtopic with details: ${error.message}`);
    }
  }

  // Update subtopic
  static async update(id, updateData) {
    try {
      const [result] = await pool.execute(`
        UPDATE course_subtopics 
        SET subtopic_name = ?, description = ?, duration_days = ?, training_by = ?, subtopic_order = ?
        WHERE id = ?
      `, [
        updateData.subtopicName,
        updateData.description,
        updateData.durationDays || 0,
        updateData.trainingBy || null,
        updateData.subtopicOrder || 0,
        id
      ]);

      if (result.affectedRows === 0) {
        throw new Error('Subtopic not found');
      }

      return result.affectedRows;
    } catch (error) {
      throw new Error(`Failed to update subtopic: ${error.message}`);
    }
  }

  // Delete subtopic
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM course_subtopics WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Subtopic not found');
      }

      return result.affectedRows;
    } catch (error) {
      throw new Error(`Failed to delete subtopic: ${error.message}`);
    }
  }

  // Bulk create subtopics for a module
  static async bulkCreate(moduleId, subtopicsData) {
    try {
      const subtopicIds = [];
      
      for (const subtopicData of subtopicsData) {
        const [result] = await pool.execute(`
          INSERT INTO course_subtopics (module_id, subtopic_name, description, duration_days, training_by, subtopic_order) 
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          moduleId,
          subtopicData.subtopicName,
          subtopicData.description,
          subtopicData.durationDays || 0,
          subtopicData.trainingBy || null,
          subtopicData.subtopicOrder || 0
        ]);
        
        subtopicIds.push(result.insertId);
      }

      return subtopicIds;
    } catch (error) {
      throw new Error(`Failed to bulk create subtopics: ${error.message}`);
    }
  }

  // Reorder subtopics within a module
  static async reorder(moduleId, subtopicOrders) {
    try {
      // subtopicOrders should be an array of {id, subtopicOrder}
      for (const { id, subtopicOrder } of subtopicOrders) {
        await pool.execute(`
          UPDATE course_subtopics 
          SET subtopic_order = ? 
          WHERE id = ? AND module_id = ?
        `, [subtopicOrder, id, moduleId]);
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to reorder subtopics: ${error.message}`);
    }
  }
}

module.exports = Subtopic;

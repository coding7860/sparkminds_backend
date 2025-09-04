const { pool } = require('../config/database');

class ClassSchedule {
  constructor(classData) {
    this.id = classData.id;
    this.class_title = classData.class_title;
    this.description = classData.description;
    this.course_id = classData.course_id;
    this.mentor_name = classData.mentor_name;
    this.class_date = classData.class_date;
    this.class_time = classData.class_time;
    this.duration = classData.duration;
    this.class_type = classData.class_type;
    this.max_trainees = classData.max_trainees;
    this.meeting_link = classData.meeting_link;
    this.created_at = classData.created_at;
    this.updated_at = classData.updated_at;
  }

  // Create a new class schedule
  static async create(classData) {
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
      } = classData;

      const [result] = await pool.execute(
        `INSERT INTO class_schedules 
         (class_title, description, course_id, mentor_name, class_date, class_time, duration, class_type, max_trainees, meeting_link) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [class_title, description, course_id, mentor_name, class_date, class_time, duration, class_type, max_trainees, meeting_link]
      );

      return result.insertId;
    } catch (error) {
      throw new Error(`Failed to create class schedule: ${error.message}`);
    }
  }

  // Find class schedule by ID
  static async findById(id) {
    try {
      const [classes] = await pool.execute(
        'SELECT * FROM class_schedules WHERE id = ?',
        [id]
      );

      return classes.length > 0 ? new ClassSchedule(classes[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find class schedule by ID: ${error.message}`);
    }
  }

  // Find all class schedules
  static async findAll() {
    try {
      const [classes] = await pool.execute(
        'SELECT * FROM class_schedules ORDER BY class_date DESC, class_time ASC'
      );

      return classes.map(cls => new ClassSchedule(cls));
    } catch (error) {
      throw new Error(`Failed to find class schedules: ${error.message}`);
    }
  }

  // Find class schedules by course ID
  static async findByCourseId(courseId) {
    try {
      const [classes] = await pool.execute(
        'SELECT * FROM class_schedules WHERE course_id = ? ORDER BY class_date DESC, class_time ASC',
        [courseId]
      );

      return classes.map(cls => new ClassSchedule(cls));
    } catch (error) {
      throw new Error(`Failed to find class schedules by course ID: ${error.message}`);
    }
  }

  // Find class schedules by mentor name
  static async findByMentor(mentorName) {
    try {
      const [classes] = await pool.execute(
        'SELECT * FROM class_schedules WHERE mentor_name = ? ORDER BY class_date DESC, class_time ASC',
        [mentorName]
      );

      return classes.map(cls => new ClassSchedule(cls));
    } catch (error) {
      throw new Error(`Failed to find class schedules by mentor: ${error.message}`);
    }
  }

  // Find upcoming classes
  static async findUpcoming() {
    try {
      const [classes] = await pool.execute(
        `SELECT * FROM class_schedules 
         WHERE CONCAT(class_date, ' ', class_time) > NOW() 
         ORDER BY class_date ASC, class_time ASC`
      );

      return classes.map(cls => new ClassSchedule(cls));
    } catch (error) {
      throw new Error(`Failed to find upcoming class schedules: ${error.message}`);
    }
  }

  // Update class schedule
  async update(updateData) {
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
      } = updateData;

      const [result] = await pool.execute(
        `UPDATE class_schedules SET 
         class_title = ?, description = ?, course_id = ?, mentor_name = ?, 
         class_date = ?, class_time = ?, duration = ?, class_type = ?, 
         max_trainees = ?, meeting_link = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [class_title, description, course_id, mentor_name, class_date, class_time, duration, class_type, max_trainees, meeting_link, this.id]
      );

      if (result.affectedRows > 0) {
        Object.assign(this, updateData);
        this.updated_at = new Date();
        return true;
      }

      return false;
    } catch (error) {
      throw new Error(`Failed to update class schedule: ${error.message}`);
    }
  }

  // Delete class schedule
  async delete() {
    try {
      const [result] = await pool.execute(
        'DELETE FROM class_schedules WHERE id = ?',
        [this.id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete class schedule: ${error.message}`);
    }
  }

  // Get class schedule without sensitive data
  toJSON() {
    return { ...this };
  }

  // Check if class is upcoming
  isUpcoming() {
    const classDateTime = new Date(`${this.class_date} ${this.class_time}`);
    return classDateTime > new Date();
  }

  // Check if class is today
  isToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.class_date === today;
  }
}

module.exports = ClassSchedule;

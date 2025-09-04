const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Find user by email/username
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return rows[0];
    } catch (error) {
      throw new Error('Database error while finding user');
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, email, role, first_name, last_name, created_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error('Database error while finding user');
    }
  }

  // Create new user
  static async create(userData) {
    try {
      const { email, password, role, first_name, last_name } = userData;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, role, first_name, last_name, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [email, hashedPassword, role, first_name, last_name]
      );
      
      return result.insertId;
    } catch (error) {
      throw new Error('Database error while creating user');
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update user last login
  static async updateLastLogin(userId) {
    try {
      await pool.execute(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }
}

module.exports = User;

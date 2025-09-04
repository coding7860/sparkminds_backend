const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.email = userData.email;
    this.password = userData.password;
    this.role = userData.role;
    this.first_name = userData.first_name;
    this.last_name = userData.last_name;
    this.phone = userData.phone;
    this.department = userData.department;
    this.enrolled_course_id = userData.enrolled_course_id;
    this.assigned_mentor_id = userData.assigned_mentor_id;
    this.status = userData.status || 'active';
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
  }

  // Create a new user
  static async create(userData) {
    try {
      const { 
        username, 
        email, 
        password, 
        role, 
        first_name, 
        last_name, 
        phone, 
        department, 
        enrolled_course_id, 
        assigned_mentor_id 
      } = userData;
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const [result] = await pool.execute(
        `INSERT INTO users (
          username, email, password, role, first_name, last_name, 
          phone, department, enrolled_course_id, assigned_mentor_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, email, hashedPassword, role, first_name, last_name, 
         phone, department, enrolled_course_id, assigned_mentor_id, 'active']
      );
      
      return result.insertId;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Find user by ID with related data
  static async findById(id) {
    try {
      const [users] = await pool.execute(`
        SELECT u.*, 
               c.course_name as enrolled_course_name,
               CONCAT(m.first_name, ' ', m.last_name) as assigned_mentor_name
        FROM users u
        LEFT JOIN courses c ON u.enrolled_course_id = c.id
        LEFT JOIN users m ON u.assigned_mentor_id = m.id
        WHERE u.id = ?
      `, [id]);
      
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  // Find user by username or email
  static async findByUsernameOrEmail(identifier) {
    try {
      const [users] = await pool.execute(`
        SELECT u.*, 
               c.course_name as enrolled_course_name,
               CONCAT(m.first_name, ' ', m.last_name) as assigned_mentor_name
        FROM users u
        LEFT JOIN courses c ON u.enrolled_course_id = c.id
        LEFT JOIN users m ON u.assigned_mentor_id = m.id
        WHERE u.username = ? OR u.email = ?
      `, [identifier, identifier]);
      
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  // Find user by username only
  static async findByUsername(username) {
    try {
      const [users] = await pool.execute(`
        SELECT u.*, 
               c.course_name as enrolled_course_name,
               CONCAT(m.first_name, ' ', m.last_name) as assigned_mentor_name
        FROM users u
        LEFT JOIN courses c ON u.enrolled_course_id = c.id
        LEFT JOIN users m ON u.assigned_mentor_id = m.id
        WHERE u.username = ?
      `, [username]);
      
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find user by username: ${error.message}`);
    }
  }

  // Find user by email only
  static async findByEmail(email) {
    try {
      const [users] = await pool.execute(`
        SELECT u.*, 
               c.course_name as enrolled_course_name,
               CONCAT(m.first_name, ' ', m.last_name) as assigned_mentor_name
        FROM users u
        LEFT JOIN courses c ON u.enrolled_course_id = c.id
        LEFT JOIN users m ON u.assigned_mentor_id = m.id
        WHERE u.email = ?
      `, [email]);
      
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  // Check if username exists
  static async isUsernameTaken(username) {
    try {
      const [users] = await pool.execute(
        'SELECT COUNT(*) as count FROM users WHERE username = ?',
        [username]
      );
      
      return users[0].count > 0;
    } catch (error) {
      throw new Error(`Failed to check username: ${error.message}`);
    }
  }

  // Check if email exists
  static async isEmailTaken(email) {
    try {
      const [users] = await pool.execute(
        'SELECT COUNT(*) as count FROM users WHERE email = ?',
        [email]
      );
      
      return users[0].count > 0;
    } catch (error) {
      throw new Error(`Failed to check email: ${error.message}`);
    }
  }

  // Find all users with related data (without passwords)
  static async findAll() {
    try {
      const [users] = await pool.execute(`
        SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, 
               u.phone, u.department, u.status, u.created_at, u.updated_at,
               u.enrolled_course_id, c.course_name as enrolled_course_name,
               u.assigned_mentor_id, CONCAT(m.first_name, ' ', m.last_name) as assigned_mentor_name
        FROM users u
        LEFT JOIN courses c ON u.enrolled_course_id = c.id
        LEFT JOIN users m ON u.assigned_mentor_id = m.id
        ORDER BY u.created_at DESC
      `);
      
      return users.map(user => new User(user));
    } catch (error) {
      throw new Error(`Failed to find users: ${error.message}`);
    }
  }

  // Find users by role
  static async findByRole(role) {
    try {
      const [users] = await pool.execute(`
        SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, 
               u.phone, u.department, u.status, u.created_at, u.updated_at,
               u.enrolled_course_id, c.course_name as enrolled_course_name,
               u.assigned_mentor_id, CONCAT(m.first_name, ' ', m.last_name) as assigned_mentor_name
        FROM users u
        LEFT JOIN courses c ON u.enrolled_course_id = c.id
        LEFT JOIN users m ON u.assigned_mentor_id = m.id
        WHERE u.role = ?
        ORDER BY u.created_at DESC
      `, [role]);
      
      return users.map(user => new User(user));
    } catch (error) {
      throw new Error(`Failed to find users by role: ${error.message}`);
    }
  }

  // Find users by department
  static async findByDepartment(department) {
    try {
      const [users] = await pool.execute(`
        SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, 
               u.phone, u.department, u.status, u.created_at, u.updated_at,
               u.enrolled_course_id, c.course_name as enrolled_course_name,
               u.assigned_mentor_id, CONCAT(m.first_name, ' ', m.last_name) as assigned_mentor_name
        FROM users u
        LEFT JOIN courses c ON u.enrolled_course_id = c.id
        LEFT JOIN users m ON u.assigned_mentor_id = m.id
        WHERE u.department = ?
        ORDER BY u.created_at DESC
      `, [department]);
      
      return users.map(user => new User(user));
    } catch (error) {
      throw new Error(`Failed to find users by department: ${error.message}`);
    }
  }

  // Find users by status
  static async findByStatus(status) {
    try {
      const [users] = await pool.execute(`
        SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, 
               u.phone, u.department, u.status, u.created_at, u.updated_at,
               u.enrolled_course_id, c.course_name as enrolled_course_name,
               u.assigned_mentor_id, CONCAT(m.first_name, ' ', m.last_name) as assigned_mentor_name
        FROM users u
        LEFT JOIN courses c ON u.enrolled_course_id = c.id
        LEFT JOIN users m ON u.assigned_mentor_id = m.id
        WHERE u.status = ?
        ORDER BY u.created_at DESC
      `, [status]);
      
      return users.map(user => new User(user));
    } catch (error) {
      throw new Error(`Failed to find users by status: ${error.message}`);
    }
  }

  // Search users
  static async search(query) {
    try {
      const searchQuery = `%${query}%`;
      const [users] = await pool.execute(`
        SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, 
               u.phone, u.department, u.status, u.created_at, u.updated_at,
               u.enrolled_course_id, c.course_name as enrolled_course_name,
               u.assigned_mentor_id, CONCAT(m.first_name, ' ', m.last_name) as assigned_mentor_name
        FROM users u
        LEFT JOIN courses c ON u.enrolled_course_id = c.id
        LEFT JOIN users m ON u.assigned_mentor_id = m.id
        WHERE u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.username LIKE ?
        ORDER BY u.created_at DESC
      `, [searchQuery, searchQuery, searchQuery, searchQuery]);
      
      return users.map(user => new User(user));
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  // Update user
  static async update(id, updateData) {
    try {
      const { 
        first_name, last_name, email, phone, department, 
        enrolled_course_id, assigned_mentor_id, status, role 
      } = updateData;
      
      let query = `
        UPDATE users SET 
          first_name = ?, last_name = ?, email = ?, phone = ?, 
          department = ?, enrolled_course_id = ?, assigned_mentor_id = ?, 
          status = ?, updated_at = CURRENT_TIMESTAMP
      `;
      let params = [first_name, last_name, email, phone, department, 
                    enrolled_course_id, assigned_mentor_id, status];
      
      // Add role update if provided
      if (role) {
        query += ', role = ?';
        params.push(role);
      }
      
      query += ' WHERE id = ?';
      params.push(id);
      
      const [result] = await pool.execute(query, params);
      
      if (result.affectedRows > 0) {
        return await User.findById(id);
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Update user password
  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      const [result] = await pool.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

  // Delete user
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Get user statistics
  static async getStatistics() {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_users,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
          SUM(CASE WHEN role = 'mentor' THEN 1 ELSE 0 END) as mentor_count,
          SUM(CASE WHEN role = 'trainee' THEN 1 ELSE 0 END) as trainee_count
        FROM users
      `);
      
      return stats[0];
    } catch (error) {
      throw new Error(`Failed to get user statistics: ${error.message}`);
    }
  }

  // Verify password
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      throw new Error(`Password verification failed: ${error.message}`);
    }
  }

  // Get user without password
  toJSON() {
    const user = { ...this };
    delete user.password;
    return user;
  }

  // Get full name
  getFullName() {
    return `${this.first_name} ${this.last_name}`.trim();
  }

  // Role checking methods
  hasRole(role) {
    return this.role === role;
  }

  isAdmin() {
    return this.role === 'admin';
  }

  isMentor() {
    return this.role === 'mentor';
  }

  isTrainee() {
    return this.role === 'trainee';
  }

  // Status checking methods
  isActive() {
    return this.status === 'active';
  }

  isInactive() {
    return this.status === 'inactive';
  }
}

module.exports = User;

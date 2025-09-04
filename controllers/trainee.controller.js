const { pool } = require('../config/database');

class TraineeController {
  // Create a new trainee
  static async createTrainee(req, res) {
    try {
      const { 
        name, 
        email, 
        password, 
        role, 
        department, 
        enrolled_course, 
        assigned_mentor, 
        phone, 
        join_date, 
        status = 'Active',
        avatar_url 
      } = req.body;

      console.log('📝 Received trainee data:', req.body);

      // Validation
      if (!name || !email || !password || !role || !department) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, password, role, and department are required'
        });
      }

      // Check if email already exists
      const [existingEmail] = await pool.execute(
        'SELECT id FROM trainee WHERE email = ?',
        [email]
      );
      
      if (existingEmail.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      // Insert into trainee table
      const [result] = await pool.execute(`
        INSERT INTO trainee (
          name, email, password, role, department, enrolled_course, 
          assigned_mentor, phone, join_date, status, avatar_url, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        name, email, hashedPassword, role, department, enrolled_course || null,
        assigned_mentor || null, phone || null, join_date || null, status, avatar_url || null
      ]);

      const traineeId = result.insertId;
      console.log('✅ Trainee created with ID:', traineeId);

      // Fetch the created trainee
      const [newTrainee] = await pool.execute(
        'SELECT * FROM trainee WHERE id = ?',
        [traineeId]
      );

      res.status(201).json({
        success: true,
        message: 'Trainee created successfully',
        data: newTrainee[0]
      });

    } catch (error) {
      console.error('Error creating trainee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create trainee',
        error: error.message
      });
    }
  }

  // Get all trainees
  static async getAllTrainees(req, res) {
    try {
      const [trainees] = await pool.execute(`
        SELECT * FROM trainee ORDER BY created_at DESC
      `);

      res.status(200).json({
        success: true,
        message: 'Trainees retrieved successfully',
        data: trainees
      });

    } catch (error) {
      console.error('Error getting trainees:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trainees',
        error: error.message
      });
    }
  }

  // Get trainee by ID
  static async getTraineeById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid trainee ID is required'
        });
      }

      const [trainees] = await pool.execute(
        'SELECT * FROM trainee WHERE id = ?',
        [parseInt(id)]
      );

      if (trainees.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Trainee not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Trainee retrieved successfully',
        data: trainees[0]
      });

    } catch (error) {
      console.error('Error getting trainee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trainee',
        error: error.message
      });
    }
  }

  // Update trainee
  static async updateTrainee(req, res) {
    try {
      const { id } = req.params;
      const { 
        name, email, role, department, enrolled_course, 
        assigned_mentor, phone, join_date, status, avatar_url 
      } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid trainee ID is required'
        });
      }

      // Check if trainee exists
      const [existingTrainee] = await pool.execute(
        'SELECT * FROM trainee WHERE id = ?',
        [parseInt(id)]
      );

      if (existingTrainee.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Trainee not found'
        });
      }

      // Update trainee
      const [result] = await pool.execute(`
        UPDATE trainee SET 
          name = ?, email = ?, role = ?, department = ?, 
          enrolled_course = ?, assigned_mentor = ?, phone = ?, 
          join_date = ?, status = ?, avatar_url = ?, updated_at = NOW()
        WHERE id = ?
      `, [
        name || existingTrainee[0].name,
        email || existingTrainee[0].email,
        role || existingTrainee[0].role,
        department || existingTrainee[0].department,
        enrolled_course || existingTrainee[0].enrolled_course,
        assigned_mentor || existingTrainee[0].assigned_mentor,
        phone || existingTrainee[0].phone,
        join_date || existingTrainee[0].join_date,
        status || existingTrainee[0].status,
        avatar_url || existingTrainee[0].avatar_url,
        parseInt(id)
      ]);

      if (result.affectedRows > 0) {
        // Fetch updated trainee
        const [updatedTrainee] = await pool.execute(
          'SELECT * FROM trainee WHERE id = ?',
          [parseInt(id)]
        );

        res.status(200).json({
          success: true,
          message: 'Trainee updated successfully',
          data: updatedTrainee[0]
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update trainee'
        });
      }

    } catch (error) {
      console.error('Error updating trainee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update trainee',
        error: error.message
      });
    }
  }

  // Delete trainee
  static async deleteTrainee(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid trainee ID is required'
        });
      }

      // Check if trainee exists
      const [existingTrainee] = await pool.execute(
        'SELECT * FROM trainee WHERE id = ?',
        [parseInt(id)]
      );

      if (existingTrainee.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Trainee not found'
        });
      }

      // Delete trainee
      const [result] = await pool.execute(
        'DELETE FROM trainee WHERE id = ?',
        [parseInt(id)]
      );

      if (result.affectedRows > 0) {
        res.status(200).json({
          success: true,
          message: 'Trainee deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete trainee'
        });
      }

    } catch (error) {
      console.error('Error deleting trainee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete trainee',
        error: error.message
      });
    }
  }

  // Search trainees
  static async searchTrainees(req, res) {
    try {
      const { query } = req.params;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const searchQuery = `%${query}%`;
      const [trainees] = await pool.execute(`
        SELECT * FROM trainee 
        WHERE name LIKE ? OR email LIKE ? OR department LIKE ?
        ORDER BY created_at DESC
      `, [searchQuery, searchQuery, searchQuery]);

      res.status(200).json({
        success: true,
        message: 'Trainees search completed',
        data: trainees
      });

    } catch (error) {
      console.error('Error searching trainees:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search trainees',
        error: error.message
      });
    }
  }

  // Get trainees by role
  static async getTraineesByRole(req, res) {
    try {
      const { role } = req.params;

      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role parameter is required'
        });
      }

      const [trainees] = await pool.execute(
        'SELECT * FROM trainee WHERE role = ? ORDER BY created_at DESC',
        [role]
      );

      res.status(200).json({
        success: true,
        message: `Trainees with role ${role} retrieved successfully`,
        data: trainees
      });

    } catch (error) {
      console.error('Error getting trainees by role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trainees by role',
        error: error.message
      });
    }
  }

  // Get trainees by department
  static async getTraineesByDepartment(req, res) {
    try {
      const { department } = req.params;

      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department parameter is required'
        });
      }

      const [trainees] = await pool.execute(
        'SELECT * FROM trainee WHERE department = ? ORDER BY created_at DESC',
        [department]
      );

      res.status(200).json({
        success: true,
        message: `Trainees in ${department} department retrieved successfully`,
        data: trainees
      });

    } catch (error) {
      console.error('Error getting trainees by department:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trainees by department',
        error: error.message
      });
    }
  }

  // Get trainee statistics
  static async getTraineeStatistics(req, res) {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_trainees,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_trainees,
          SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive_trainees,
          COUNT(DISTINCT department) as total_departments,
          COUNT(DISTINCT enrolled_course) as total_courses
        FROM trainee
      `);

      res.status(200).json({
        success: true,
        message: 'Trainee statistics retrieved successfully',
        data: stats[0]
      });

    } catch (error) {
      console.error('Error getting trainee statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trainee statistics',
        error: error.message
      });
    }
  }
}

module.exports = TraineeController;

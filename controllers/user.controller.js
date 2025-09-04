const User = require('../models/User.model');
const { pool } = require('../config/database');

class UserController {
  // Create a new user
  static async createUser(req, res) {
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
      } = req.body;

      // Validation
      if (!username || !email || !password || !role || !first_name || !last_name) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, password, role, first name, and last name are required'
        });
      }

      // Validate role
      if (!['admin', 'mentor', 'trainee'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be admin, mentor, or trainee'
        });
      }

      // Check if username or email already exists
      const existingUser = await User.findByUsernameOrEmail(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }

      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Validate course and mentor if provided
      if (enrolled_course_id) {
        const [courseRows] = await pool.execute('SELECT id FROM courses WHERE id = ?', [enrolled_course_id]);
        if (courseRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Enrolled course not found'
          });
        }
      }

      if (assigned_mentor_id) {
        const [mentorRows] = await pool.execute('SELECT id, role FROM users WHERE id = ? AND role = "mentor"', [assigned_mentor_id]);
        if (mentorRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Assigned mentor not found or is not a mentor'
          });
        }
      }

      // Create user data object
      const userData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: role.trim(),
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        phone: phone ? phone.trim() : null,
        department: department ? department.trim() : null,
        enrolled_course_id: enrolled_course_id || null,
        assigned_mentor_id: assigned_mentor_id || null
      };

      // Create the user
      const userId = await User.create(userData);
      const newUser = await User.findById(userId);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser.toJSON()
      });

    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }
  }

  // Get all users with filtering and pagination
  static async getAllUsers(req, res) {
    try {
      const { 
        role, 
        department, 
        status, 
        search, 
        page = 1, 
        limit = 10 
      } = req.query;

      let users = [];

      // Apply filters
      if (search) {
        users = await User.search(search);
      } else if (role) {
        users = await User.findByRole(role);
      } else if (department) {
        users = await User.findByDepartment(department);
      } else if (status) {
        users = await User.findByStatus(status);
      } else {
        users = await User.findAll();
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedUsers = users.slice(startIndex, endIndex);

      // Get total count for pagination info
      const totalUsers = users.length;
      const totalPages = Math.ceil(totalUsers / limit);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: paginatedUsers.map(user => user.toJSON()),
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalUsers,
            hasNextPage: endIndex < totalUsers,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: error.message
      });
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required'
        });
      }

      const user = await User.findById(parseInt(id));

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user.toJSON()
      });

    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: error.message
      });
    }
  }

  // Update user
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { 
        first_name, 
        last_name, 
        email, 
        phone, 
        department, 
        enrolled_course_id, 
        assigned_mentor_id, 
        status, 
        role 
      } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required'
        });
      }

      // Check if user exists
      const existingUser = await User.findById(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Validate role if provided
      if (role && !['admin', 'mentor', 'trainee'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be admin, mentor, or trainee'
        });
      }

      // Validate status if provided
      if (status && !['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be active or inactive'
        });
      }

      // Validate course if provided
      if (enrolled_course_id) {
        const [courseRows] = await pool.execute('SELECT id FROM courses WHERE id = ?', [enrolled_course_id]);
        if (courseRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Enrolled course not found'
          });
        }
      }

      // Validate mentor if provided
      if (assigned_mentor_id) {
        const [mentorRows] = await pool.execute('SELECT id, role FROM users WHERE id = ? AND role = "mentor"', [assigned_mentor_id]);
        if (mentorRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Assigned mentor not found or is not a mentor'
          });
        }
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== existingUser.email) {
        const emailExists = await User.findByEmail(email);
        if (emailExists && emailExists.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }

      // Update user data object
      const updateData = {
        first_name: first_name ? first_name.trim() : existingUser.first_name,
        last_name: last_name ? last_name.trim() : existingUser.last_name,
        email: email ? email.trim().toLowerCase() : existingUser.email,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : existingUser.phone,
        department: department !== undefined ? (department ? department.trim() : null) : existingUser.department,
        enrolled_course_id: enrolled_course_id !== undefined ? enrolled_course_id : existingUser.enrolled_course_id,
        assigned_mentor_id: assigned_mentor_id !== undefined ? assigned_mentor_id : existingUser.assigned_mentor_id,
        status: status || existingUser.status,
        role: role || existingUser.role
      };

      // Update the user
      const updatedUser = await User.update(parseInt(id), updateData);

      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update user'
        });
      }

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser.toJSON()
      });

    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  }

  // Update user password
  static async updateUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required'
        });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // Get user with password for verification
      const [userRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = new User(userRows[0]);

      // Verify current password
      const isPasswordValid = await user.verifyPassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      const success = await User.updatePassword(parseInt(id), newPassword);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update password'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update password',
        error: error.message
      });
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required'
        });
      }

      // Check if user exists
      const existingUser = await User.findById(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete the user
      const success = await User.delete(parseInt(id));

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete user'
        });
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }

  // Get user statistics
  static async getUserStatistics(req, res) {
    try {
      const stats = await User.getStatistics();

      res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('Error getting user statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user statistics',
        error: error.message
      });
    }
  }

  // Get available departments
  static async getDepartments(req, res) {
    try {
      const [departments] = await pool.execute(`
        SELECT DISTINCT department 
        FROM users 
        WHERE department IS NOT NULL AND department != ''
        ORDER BY department
      `);

      res.status(200).json({
        success: true,
        message: 'Departments retrieved successfully',
        data: departments.map(dept => dept.department)
      });

    } catch (error) {
      console.error('Error getting departments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve departments',
        error: error.message
      });
    }
  }

  // Get available mentors
  static async getMentors(req, res) {
    try {
      const [mentors] = await pool.execute(`
        SELECT id, first_name, last_name, email, department
        FROM users 
        WHERE role = 'mentor' AND status = 'active'
        ORDER BY first_name, last_name
      `);

      res.status(200).json({
        success: true,
        message: 'Mentors retrieved successfully',
        data: mentors.map(mentor => ({
          id: mentor.id,
          name: `${mentor.first_name} ${mentor.last_name}`,
          email: mentor.email,
          department: mentor.department
        }))
      });

    } catch (error) {
      console.error('Error getting mentors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve mentors',
        error: error.message
      });
    }
  }

  // Get available courses
  static async getCourses(req, res) {
    try {
      const [courses] = await pool.execute(`
        SELECT id, course_name, description, department
        FROM courses 
        ORDER BY course_name
      `);

      res.status(200).json({
        success: true,
        message: 'Courses retrieved successfully',
        data: courses
      });

    } catch (error) {
      console.error('Error getting courses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve courses',
        error: error.message
      });
    }
  }

  // Bulk update user status
  static async bulkUpdateStatus(req, res) {
    try {
      const { userIds, status } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
      }

      if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status (active or inactive) is required'
        });
      }

      // Update multiple users
      const [result] = await pool.execute(
        'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (?)',
        [status, userIds]
      );

      res.status(200).json({
        success: true,
        message: `Status updated successfully for ${result.affectedRows} users`,
        data: {
          updatedCount: result.affectedRows,
          status
        }
      });

    } catch (error) {
      console.error('Error bulk updating user status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update user status',
        error: error.message
      });
    }
  }

  // Export users (for admin use)
  static async exportUsers(req, res) {
    try {
      const { format = 'json' } = req.query;

      const users = await User.findAll();
      const userData = users.map(user => user.toJSON());

      if (format === 'csv') {
        // Convert to CSV format
        const csvHeaders = ['ID', 'Username', 'Email', 'Role', 'First Name', 'Last Name', 'Phone', 'Department', 'Status', 'Enrolled Course', 'Assigned Mentor', 'Created At'];
        const csvRows = userData.map(user => [
          user.id,
          user.username,
          user.email,
          user.role,
          user.first_name,
          user.last_name,
          user.phone || '',
          user.department || '',
          user.status,
          user.enrolled_course_name || '',
          user.assigned_mentor_name || '',
          user.created_at
        ]);

        const csvContent = [csvHeaders, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
        res.status(200).send(csvContent);
      } else {
        // Return JSON format
        res.status(200).json({
          success: true,
          message: 'Users exported successfully',
          data: userData
        });
      }

    } catch (error) {
      console.error('Error exporting users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export users',
        error: error.message
      });
    }
  }
}

module.exports = UserController;

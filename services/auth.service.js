const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiry = '24h';
  }

  // Generate JWT token
  generateToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    };

    return jwt.sign(payload, this.jwtSecret, { 
      expiresIn: this.jwtExpiry 
    });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // User registration
  async register(userData) {
    try {
      // Enhanced duplicate checking
      const { username, email, password, role, first_name, last_name } = userData;
      
      // Check if username already exists
      const isUsernameTaken = await User.isUsernameTaken(username);
      if (isUsernameTaken) {
        throw new Error('Username already exists. Please choose a different username.');
      }

      // Check if email already exists
      const isEmailTaken = await User.isEmailTaken(email);
      if (isEmailTaken) {
        throw new Error('Email already exists. Please use a different email address or login with existing account.');
      }

      // Password strength validation
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      // Check for common weak passwords
      const weakPasswords = ['123456', 'password', 'admin', 'user', '123456789', 'qwerty', 'abc123'];
      if (weakPasswords.includes(password.toLowerCase())) {
        throw new Error('Password is too weak. Please choose a stronger password.');
      }

      // Check if password contains username or email
      if (password.toLowerCase().includes(username.toLowerCase()) || 
          password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
        throw new Error('Password should not contain your username or email.');
      }

      // Create new user
      const userId = await User.create(userData);
      const user = await User.findById(userId);

      // Generate token
      const token = this.generateToken(user);

      return {
        message: 'User registered successfully',
        token,
        user: user.toJSON()
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // User login
  async login(identifier, password) {
    try {
      // Find user by username or email
      const user = await User.findByUsernameOrEmail(identifier);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = this.generateToken(user);

      return {
        message: 'Login successful',
        token,
        user: user.toJSON()
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Role-based login with dashboard routing
  async roleLogin(email, password) {
    try {
      // Find user by email in the database
      const user = await User.findByUsernameOrEmail(email);
      if (!user) {
        throw new Error('User not found. Please check your email or register first.');
      }

      // Verify password
      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid password. Please check your credentials.');
      }

      // Strict role validation - only allow specific roles
      if (!['admin', 'mentor', 'trainee'].includes(user.role)) {
        throw new Error('Invalid user role. Access denied.');
      }

      // Determine dashboard URL based on user role ONLY
      let dashboardUrl = '';
      switch (user.role) {
        case 'admin':
          dashboardUrl = '/admin-dashboard';
          break;
        case 'mentor':
          dashboardUrl = '/mentor-dashboard';
          break;
        case 'trainee':
          dashboardUrl = '/trainee-dashboard';
          break;
        default:
          // This should never happen due to validation above, but just in case
          throw new Error('Invalid user role. Access denied.');
      }

      // Generate token with role information
      const token = this.generateToken(user);

      return {
        message: 'Login successful',
        token,
        user: user.toJSON(),
        dashboardUrl: dashboardUrl,
        role: user.role // Explicitly return the role for frontend validation
      };
    } catch (error) {
      throw new Error(`Role login failed: ${error.message}`);
    }
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        user: user.toJSON()
      };
    } catch (error) {
      throw new Error(`Failed to get profile: ${error.message}`);
    }
  }

  // Refresh token
  async refreshToken(token) {
    try {
      const decoded = this.verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new token
      const newToken = this.generateToken(user);

      return {
        message: 'Token refreshed successfully',
        token: newToken,
        user: user.toJSON()
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }
}

module.exports = new AuthService();

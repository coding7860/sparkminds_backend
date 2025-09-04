const authService = require('../services/auth.service');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Strict role validation
    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Access denied.',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Predefined role middleware with strict validation
const requireAdmin = authorize('admin');
const requireMentor = authorize('mentor', 'admin');
const requireTrainee = authorize('trainee');

// Generic role requirement middleware
const requireRole = (roles) => {
  if (typeof roles === 'string') {
    return authorize(roles);
  }
  return authorize(...roles);
};

// Strict authentication guard - prevents any unauthorized access
const strictAuthGuard = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login with valid credentials.',
      code: 'AUTH_REQUIRED'
    });
  }

  // Ensure user has a valid role
  if (!req.user.role || !['admin', 'mentor', 'trainee'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid user role. Access denied.',
      code: 'INVALID_ROLE',
      userRole: req.user.role
    });
  }

  // Ensure user ID exists and is valid
  if (!req.user.userId || isNaN(req.user.userId)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid user session. Please login again.',
      code: 'INVALID_SESSION'
    });
  }

  next();
};

// Dashboard access middleware - ensures users can only access their assigned dashboard
const requireDashboardAccess = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has the required role for this dashboard
    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This dashboard is only for ${requiredRole}s.`,
        userRole: req.user.role,
        requiredRole: requiredRole,
        code: 'DASHBOARD_ACCESS_DENIED'
      });
    }

    next();
  };
};

// Rate limiting middleware
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      const userRequests = requests.get(ip);
      
      if (now > userRequests.resetTime) {
        userRequests.count = 1;
        userRequests.resetTime = now + windowMs;
      } else if (userRequests.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later'
        });
      } else {
        userRequests.count++;
      }
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireMentor,
  requireTrainee,
  requireRole,
  requireDashboardAccess,
  rateLimit,
  strictAuthGuard
};

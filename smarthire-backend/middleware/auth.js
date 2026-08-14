import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token
export const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// Optional authentication - doesn't require token but attaches user if valid
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') 
      ? req.headers.authorization.split(' ')[1] 
      : null;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    next(); // Continue without user
  }
};

// Authorize specific roles (Super Admin automatically has access to admin routes)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login first'
      });
    }
    
    // Superadmin bypasses admin level checks
    const userRole = req.user.role;
    const isAllowed = userRole === 'superadmin' || roles.includes(userRole);

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};

// Require Super Admin strictly (for superadmin-only operations like recruiter creation & linkedin automation)
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login first'
    });
  }

  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin privileges required.'
    });
  }

  next();
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

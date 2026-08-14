import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticate, generateToken } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('company')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name cannot exceed 100 characters'),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { name, email, password, company, role } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
      
      // Create new user
      const user = await User.create({
        name,
        email,
        password,
        company,
        role: role || 'recruiter'
      });
      
      // Generate token
      const token = generateToken(user._id);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user,
          token
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .exists()
      .withMessage('Password is required'),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user with password
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated. Please contact support.'
        });
      }
      
      // Check password
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      // Generate token
      const token = generateToken(user._id);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            company: user.company,
            refCode: user.refCode,
            lastLogin: user.lastLogin
          },
          token
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  authenticate,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('company')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name cannot exceed 100 characters'),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { name, company } = req.body;
      
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { name, company },
        { new: true, runValidators: true }
      );
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticate, (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

export default router;

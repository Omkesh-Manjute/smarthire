import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Candidate from '../models/Candidate.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Generate verification link
const generateVerificationLink = (token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/verify?token=${token}`;
};

// @route   POST /api/verification/send-link
// @desc    Send verification link to candidate
// @access  Private
router.post('/send-link', authenticate, async (req, res) => {
  try {
    const { candidateId, email } = req.body;
    
    // Find candidate
    const candidate = await Candidate.findOne({
      _id: candidateId,
      createdBy: req.user._id,
      isActive: true
    });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Generate unique token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry
    
    // Update candidate with verification details
    candidate.verification.token = token;
    candidate.verification.linkExpiresAt = expiresAt;
    candidate.verification.linkSentAt = new Date();
    candidate.status = 'in_progress';
    
    await candidate.save();
    
    // Generate link
    const verificationLink = generateVerificationLink(token);
    
    // In production, send email here using nodemailer
    // For now, return the link in response
    
    res.json({
      success: true,
      message: 'Verification link generated successfully',
      data: {
        verificationLink,
        expiresAt,
        candidate: {
          id: candidate._id,
          name: candidate.name,
          email: candidate.email
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send verification link',
      error: error.message
    });
  }
});

// @route   GET /api/verification/validate-token
// @desc    Validate verification token
// @access  Public
router.get('/validate-token', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }
    
    // Find candidate by token
    const candidate = await Candidate.findOne({
      'verification.token': token,
      isActive: true
    });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired verification link'
      });
    }
    
    // Check if link is expired
    if (candidate.verification.linkExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification link has expired'
      });
    }
    
    // Check if already completed
    if (candidate.status === 'trusted') {
      return res.status(400).json({
        success: false,
        message: 'Verification already completed'
      });
    }
    
    res.json({
      success: true,
      data: {
        valid: true,
        candidate: {
          id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          role: candidate.role
        },
        verificationStarted: candidate.verification.startedAt ? true : false
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate token',
      error: error.message
    });
  }
});

// @route   POST /api/verification/start
// @desc    Start verification process
// @access  Public (with token)
router.post('/start', async (req, res) => {
  try {
    const { token } = req.body;
    
    const candidate = await Candidate.findOne({
      'verification.token': token,
      isActive: true
    });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    // Mark verification as started
    candidate.verification.startedAt = new Date();
    await candidate.save();
    
    res.json({
      success: true,
      message: 'Verification started',
      data: {
        candidate: {
          id: candidate._id,
          name: candidate.name,
          email: candidate.email
        },
        checks: candidate.verification.checks
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start verification',
      error: error.message
    });
  }
});

// @route   POST /api/verification/submit-check
// @desc    Submit a verification check (GPS, IP, Selfie, etc.)
// @access  Public (with token)
router.post('/submit-check', async (req, res) => {
  try {
    const { token, checkType, data, score } = req.body;
    
    const candidate = await Candidate.findOne({
      'verification.token': token,
      isActive: true
    });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    // Find and update the specific check
    const checkIndex = candidate.verification.checks.findIndex(
      c => c.type === checkType
    );
    
    if (checkIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid check type'
      });
    }
    
    // Update check
    candidate.verification.checks[checkIndex].status = 'completed';
    candidate.verification.checks[checkIndex].score = score || 0;
    candidate.verification.checks[checkIndex].data = data;
    candidate.verification.checks[checkIndex].completedAt = new Date();
    
    // Recalculate trust score
    candidate.calculateTrustScore();
    
    await candidate.save();
    
    res.json({
      success: true,
      message: `${checkType} verification submitted`,
      data: {
        check: candidate.verification.checks[checkIndex],
        currentScore: candidate.trustScore,
        status: candidate.status,
        progress: candidate.verificationProgress
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit check',
      error: error.message
    });
  }
});

// @route   POST /api/verification/complete
// @desc    Complete full verification
// @access  Public (with token)
router.post('/complete', async (req, res) => {
  try {
    const { token } = req.body;
    
    const candidate = await Candidate.findOne({
      'verification.token': token,
      isActive: true
    });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    // Mark verification as completed
    candidate.verification.completedAt = new Date();
    candidate.calculateTrustScore();
    await candidate.save();
    
    res.json({
      success: true,
      message: 'Verification completed successfully',
      data: {
        candidate: {
          id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          trustScore: candidate.trustScore,
          status: candidate.status
        },
        scoreBreakdown: candidate.getScoreBreakdown(),
        completedAt: candidate.verification.completedAt
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to complete verification',
      error: error.message
    });
  }
});

// @route   GET /api/verification/status/:token
// @desc    Get verification status
// @access  Public (with token)
router.get('/status/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const candidate = await Candidate.findOne({
      'verification.token': token,
      isActive: true
    });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    res.json({
      success: true,
      data: {
        candidate: {
          id: candidate._id,
          name: candidate.name,
          trustScore: candidate.trustScore,
          status: candidate.status
        },
        checks: candidate.verification.checks,
        progress: candidate.verificationProgress,
        isComplete: candidate.status === 'trusted' || candidate.status === 'high_risk'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get status',
      error: error.message
    });
  }
});

export default router;

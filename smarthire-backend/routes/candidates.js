import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Candidate from '../models/Candidate.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation helper
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

// @route   GET /api/candidates
// @desc    Get all candidates for logged in recruiter
// @access  Private
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'in_progress', 'trusted', 'medium_risk', 'high_risk', 'rejected']),
    query('search').optional().trim().escape(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { status, search, page = 1, limit = 10 } = req.query;
      
      // Build query based on role
      const isSuperAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
      const queryObj = isSuperAdmin
        ? { isActive: true }
        : {
            $or: [
              { referredByRecruiter: req.user._id },
              { createdBy: req.user._id },
              { recruiterRefCode: req.user.refCode }
            ],
            isActive: true
          };
      
      if (status) {
        queryObj.status = status;
      }
      
      if (search) {
        queryObj.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { role: { $regex: search, $options: 'i' } },
          { referredByRecruiterName: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Execute query
      const candidates = await Candidate.find(queryObj)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Candidate.countDocuments(queryObj);
      
      // Format response with attribution details
      const formattedCandidates = candidates.map(c => ({
        id: c._id,
        name: c.name,
        email: c.email,
        role: c.role,
        location: c.location?.city + (c.location?.state ? `, ${c.location.state}` : ''),
        score: c.trustScore,
        status: c.status,
        date: c.createdAt.toISOString().split('T')[0],
        verificationProgress: c.verificationProgress,
        referredByRecruiterName: c.referredByRecruiterName || 'Direct Applicant',
        recruiterRefCode: c.recruiterRefCode || null
      }));
      
      res.json({
        success: true,
        data: {
          candidates: formattedCandidates,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch candidates',
        error: error.message
      });
    }
  }
);

router.get('/:id', authenticate, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
    const queryObj = isSuperAdmin
      ? { _id: req.params.id, isActive: true }
      : {
          _id: req.params.id,
          $or: [
            { referredByRecruiter: req.user._id },
            { createdBy: req.user._id },
            { recruiterRefCode: req.user.refCode }
          ],
          isActive: true
        };

    const candidate = await Candidate.findOne(queryObj);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    res.json({
      success: true,
      data: { candidate }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch candidate',
      error: error.message
    });
  }
});

// @route   POST /api/candidates
// @desc    Create new candidate
// @access  Private
router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('role').trim().notEmpty().withMessage('Role is required'),
    body('location').optional().isObject(),
    body('skills').optional().isArray(),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { name, email, role, location, skills, phone, experience, notes, linkedInUrl, recruiterRefCode } = req.body;
      const User = (await import('../models/User.js')).default;
      
      // Check if candidate already exists
      const existingCandidate = await Candidate.findOne({
        email,
        isActive: true
      });
      
      if (existingCandidate) {
        return res.status(400).json({
          success: false,
          message: 'Candidate with this email already exists'
        });
      }
      
      // Resolve recruiter attribution
      let referredByRecruiter = req.user?._id;
      let referredByRecruiterName = req.user?.name;
      let refCode = recruiterRefCode || req.user?.refCode;

      if (recruiterRefCode) {
        const recruiterUser = await User.findOne({ refCode: recruiterRefCode });
        if (recruiterUser) {
          referredByRecruiter = recruiterUser._id;
          referredByRecruiterName = recruiterUser.name;
          refCode = recruiterUser.refCode;
        }
      }

      // Create candidate
      const candidate = await Candidate.create({
        name,
        email,
        role,
        location,
        skills,
        phone,
        experience,
        notes,
        linkedInUrl,
        createdBy: req.user._id,
        referredByRecruiter,
        referredByRecruiterName,
        recruiterRefCode: refCode,
        verification: {
          checks: [
            { type: 'gps', status: 'pending' },
            { type: 'ip', status: 'pending' },
            { type: 'selfie', status: 'pending' },
            { type: 'video', status: 'pending' },
            { type: 'document', status: 'pending' },
            { type: 'linkedin', status: 'pending' }
          ]
        }
      });
      
      res.status(201).json({
        success: true,
        message: 'Candidate created successfully',
        data: { candidate }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create candidate',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/candidates/:id
// @desc    Update candidate
// @access  Private
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('role').optional().trim().notEmpty(),
    body('notes').optional().trim().isLength({ max: 1000 }),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { name, role, location, skills, phone, experience, notes, linkedInUrl } = req.body;
      
      const isSuperAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
      const queryObj = isSuperAdmin
        ? { _id: req.params.id, isActive: true }
        : {
            _id: req.params.id,
            $or: [
              { referredByRecruiter: req.user._id },
              { createdBy: req.user._id },
              { recruiterRefCode: req.user.refCode }
            ],
            isActive: true
          };

      const candidate = await Candidate.findOneAndUpdate(
        queryObj,
        { name, role, location, skills, phone, experience, notes, linkedInUrl },
        { new: true, runValidators: true }
      );
      
      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: 'Candidate not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Candidate updated successfully',
        data: { candidate }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update candidate',
        error: error.message
      });
    }
  }
);

// @route   DELETE /api/candidates/:id
// @desc    Soft delete candidate
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
    const queryObj = isSuperAdmin
      ? { _id: req.params.id }
      : {
          _id: req.params.id,
          $or: [
            { referredByRecruiter: req.user._id },
            { createdBy: req.user._id },
            { recruiterRefCode: req.user.refCode }
          ]
        };

    const candidate = await Candidate.findOneAndUpdate(
      queryObj,
      { isActive: false },
      { new: true }
    );
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Candidate deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete candidate',
      error: error.message
    });
  }
});

// @route   GET /api/candidates/:id/score
// @desc    Get candidate trust score breakdown
// @access  Private
router.get('/:id/score', authenticate, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
    const queryObj = isSuperAdmin
      ? { _id: req.params.id, isActive: true }
      : {
          _id: req.params.id,
          $or: [
            { referredByRecruiter: req.user._id },
            { createdBy: req.user._id },
            { recruiterRefCode: req.user.refCode }
          ],
          isActive: true
        };

    const candidate = await Candidate.findOne(queryObj);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    const breakdown = candidate.getScoreBreakdown();
    
    res.json({
      success: true,
      data: {
        candidate: {
          id: candidate._id,
          name: candidate.name,
          score: candidate.trustScore,
          status: candidate.status
        },
        breakdown: {
          gps: { label: 'GPS Location', score: breakdown.gps, max: 30 },
          ip: { label: 'IP Geolocation', score: breakdown.ip, max: 20 },
          selfie: { label: 'Selfie Match', score: breakdown.selfie, max: 10 },
          video: { label: 'Video Check', score: breakdown.video, max: 10 },
          document: { label: 'ID Document', score: breakdown.document, max: 20 },
          linkedin: { label: 'LinkedIn', score: breakdown.linkedin, max: 10 }
        },
        total: candidate.trustScore,
        verificationChecks: candidate.verification.checks
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch score',
      error: error.message
    });
  }
});

// @route   GET /api/candidates/stats/overview
// @desc    Get candidate statistics for dashboard
// @access  Private
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
    const matchQuery = isSuperAdmin
      ? { isActive: true }
      : {
          $or: [
            { referredByRecruiter: req.user._id },
            { createdBy: req.user._id },
            { recruiterRefCode: req.user.refCode }
          ],
          isActive: true
        };
    
    // Get counts by status
    const stats = await Candidate.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format stats
    const statusCounts = {
      total: 0,
      trusted: 0,
      medium_risk: 0,
      high_risk: 0,
      pending: 0,
      in_progress: 0
    };
    
    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
      statusCounts.total += stat.count;
    });
    
    // Get recent candidates
    const recentCandidates = await Candidate.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name role trustScore status createdAt');
    
    res.json({
      success: true,
      data: {
        stats: statusCounts,
        recent: recentCandidates
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
});

export default router;

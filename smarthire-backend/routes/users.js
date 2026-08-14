import express from 'express';
import User from '../models/User.js';
import { authenticate, authorize, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get recruiter performance leaderboard and sourcing rankings
// @access  Private
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const Candidate = (await import('../models/Candidate.js')).default;
    
    const recruiters = await User.find({ role: { $in: ['recruiter', 'admin', 'superadmin'] } })
      .select('name email role company refCode createdAt')
      .sort({ createdAt: -1 });
      
    const leaderboardData = await Promise.all(
      recruiters.map(async (rec) => {
        const totalSourced = await Candidate.countDocuments({
          $or: [
            { referredByRecruiter: rec._id },
            { createdBy: rec._id },
            { recruiterRefCode: rec.refCode }
          ],
          isActive: true
        });

        const trustedCount = await Candidate.countDocuments({
          $or: [
            { referredByRecruiter: rec._id },
            { createdBy: rec._id },
            { recruiterRefCode: rec.refCode }
          ],
          status: 'trusted',
          isActive: true
        });

        const highRiskCount = await Candidate.countDocuments({
          $or: [
            { referredByRecruiter: rec._id },
            { createdBy: rec._id },
            { recruiterRefCode: rec.refCode }
          ],
          status: 'high_risk',
          isActive: true
        });

        const trustRate = totalSourced > 0 ? Math.round((trustedCount / totalSourced) * 100) : 100;

        return {
          id: rec._id,
          name: rec.name,
          email: rec.email,
          refCode: rec.refCode || rec.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          company: rec.company || 'SmartHire Client',
          totalSourced,
          trustedCount,
          highRiskCount,
          trustRate
        };
      })
    );

    // Sort leaderboard by total candidates sourced descending
    leaderboardData.sort((a, b) => b.totalSourced - a.totalSourced || b.trustRate - a.trustRate);

    // Add rank numbers
    const rankedLeaderboard = leaderboardData.map((item, index) => ({
      rank: index + 1,
      ...item
    }));

    res.json({
      success: true,
      data: { leaderboard: rankedLeaderboard }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recruiter leaderboard',
      error: error.message
    });
  }
});

// @route   GET /api/users/recruiters
// @desc    Get all recruiters with candidate attribution counts (superadmin only)
// @access  Private/SuperAdmin
router.get('/recruiters', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const Candidate = (await import('../models/Candidate.js')).default;
    
    const recruiters = await User.find({ role: { $in: ['recruiter', 'admin'] } })
      .select('name email role company refCode isActive lastLogin createdAt')
      .sort({ createdAt: -1 });
      
    // Calculate candidate counts for each recruiter
    const recruiterList = await Promise.all(
      recruiters.map(async (rec) => {
        const candidateCount = await Candidate.countDocuments({
          $or: [
            { referredByRecruiter: rec._id },
            { createdBy: rec._id },
            { recruiterRefCode: rec.refCode }
          ],
          isActive: true
        });

        const trustedCount = await Candidate.countDocuments({
          $or: [
            { referredByRecruiter: rec._id },
            { createdBy: rec._id },
            { recruiterRefCode: rec.refCode }
          ],
          status: 'trusted',
          isActive: true
        });

        return {
          ...rec.toObject(),
          totalCandidates: candidateCount,
          trustedCandidates: trustedCount
        };
      })
    );

    res.json({
      success: true,
      data: { recruiters: recruiterList }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recruiters list',
      error: error.message
    });
  }
});

// @route   POST /api/users/recruiter
// @desc    Create a new recruiter account (Super Admin only)
// @access  Private/SuperAdmin
router.post('/recruiter', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, company, customRefCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Slugify custom ref code or let User pre-save generate it
    let refCode = customRefCode
      ? customRefCode.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
      : undefined;

    if (refCode) {
      const existingRef = await User.findOne({ refCode });
      if (existingRef) {
        refCode = `${refCode}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    const newRecruiter = await User.create({
      name,
      email,
      password,
      company: company || req.user.company || 'SmartHire Client',
      role: 'recruiter',
      refCode,
      createdByAdmin: req.user._id
    });

    res.status(201).json({
      success: true,
      message: `Recruiter ${newRecruiter.name} account created successfully!`,
      data: {
        recruiter: {
          _id: newRecruiter._id,
          name: newRecruiter.name,
          email: newRecruiter.email,
          role: newRecruiter.role,
          refCode: newRecruiter.refCode,
          company: newRecruiter.company,
          isActive: newRecruiter.isActive
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create recruiter account',
      error: error.message
    });
  }
});

// @route   PATCH /api/users/recruiters/:id/status
// @desc    Toggle recruiter active/inactive status (Super Admin only)
// @access  Private/SuperAdmin
router.patch('/recruiters/:id/status', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }

    user.isActive = typeof isActive === 'boolean' ? isActive : !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Recruiter ${user.name} status updated to ${user.isActive ? 'Active' : 'Inactive'}`,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update recruiter status',
      error: error.message
    });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data (Scoped by role & referral code)
// @access  Private
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const Candidate = (await import('../models/Candidate.js')).default;
    
    // Filter query depending on user role
    const isSuperAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
    const matchFilter = isSuperAdmin
      ? { isActive: true }
      : {
          $or: [
            { referredByRecruiter: req.user._id },
            { createdBy: req.user._id },
            { recruiterRefCode: req.user.refCode }
          ],
          isActive: true
        };

    const stats = await Candidate.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          trusted: {
            $sum: { $cond: [{ $eq: ['$status', 'trusted'] }, 1, 0] }
          },
          mediumRisk: {
            $sum: { $cond: [{ $eq: ['$status', 'medium_risk'] }, 1, 0] }
          },
          highRisk: {
            $sum: { $cond: [{ $eq: ['$status', 'high_risk'] }, 1, 0] }
          },
          avgScore: { $avg: '$trustScore' }
        }
      }
    ]);
    
    const dashboardStats = stats[0] || {
      total: 0,
      trusted: 0,
      mediumRisk: 0,
      highRisk: 0,
      avgScore: 0
    };
    
    // Get recent verifications
    const recent = await Candidate.find(matchFilter)
      .sort({ createdAt: -1 })
      .limit(8)
      .select('name role trustScore status referredByRecruiterName recruiterRefCode createdAt');
    
    res.json({
      success: true,
      data: {
        user: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          company: req.user.company,
          refCode: req.user.refCode,
          lastLogin: req.user.lastLogin
        },
        stats: {
          totalVerifications: dashboardStats.total,
          trusted: dashboardStats.trusted,
          mediumRisk: dashboardStats.mediumRisk,
          highRisk: dashboardStats.highRisk,
          averageScore: Math.round(dashboardStats.avgScore || 0)
        },
        recentVerifications: recent
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

export default router;

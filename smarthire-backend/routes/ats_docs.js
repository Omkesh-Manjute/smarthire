import express from 'express';
import mongoose from 'mongoose';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Simple schema for ATS candidate document metadata (keyed by local canId)
const atsDocSchema = new mongoose.Schema({
  canId: { type: String, required: true, unique: true, index: true },
  email: { type: String, trim: true, lowercase: true },
  candidateName: { type: String, trim: true },
  legalDocs: { type: mongoose.Schema.Types.Mixed, default: {} },
  updatedBy: { type: String },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Use or create the model (avoids duplicate model registration on hot reload)
const ATSDoc = mongoose.models.ATSDoc || mongoose.model('ATSDoc', atsDocSchema);

// @route   PATCH /api/ats/documents
// @desc    Save (upsert) legal document metadata for an ATS candidate by canId
// @access  Public (optionalAuth — works with or without valid JWT)
router.patch('/documents', optionalAuth, async (req, res) => {
  try {
    const { canId, email, candidateName, legalDocs } = req.body;

    if (!canId) {
      return res.status(400).json({
        success: false,
        message: 'canId is required'
      });
    }

    if (!legalDocs || typeof legalDocs !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'legalDocs object is required'
      });
    }

    // Strip base64 fileData — keep only metadata for DB storage
    const cleanedDocs = {};
    for (const [key, doc] of Object.entries(legalDocs)) {
      if (doc && typeof doc === 'object') {
        const { fileData, resumeText, ...rest } = doc; // eslint-disable-line no-unused-vars
        cleanedDocs[key] = {
          ...rest,
          hasFile: !!(fileData || doc.fileData),
          savedAt: new Date().toISOString()
        };
      }
    }

    // Upsert by canId — create if not exists, update if exists
    const doc = await ATSDoc.findOneAndUpdate(
      { canId },
      {
        $set: {
          canId,
          email: email || undefined,
          candidateName: candidateName || undefined,
          legalDocs: cleanedDocs,
          updatedBy: req.user?.name || req.user?.email || 'recruiter',
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true, runValidators: false }
    );

    res.json({
      success: true,
      message: 'Legal documents saved to database successfully',
      data: {
        canId: doc.canId,
        legalDocs: doc.legalDocs,
        savedAt: doc.updatedAt
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save legal documents',
      error: error.message
    });
  }
});

// @route   GET /api/ats/documents/:canId
// @desc    Get saved legal document metadata for an ATS candidate
// @access  Public (optionalAuth)
router.get('/documents/:canId', optionalAuth, async (req, res) => {
  try {
    const doc = await ATSDoc.findOne({ canId: req.params.canId });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'No saved documents found for this candidate'
      });
    }

    res.json({
      success: true,
      data: {
        canId: doc.canId,
        legalDocs: doc.legalDocs,
        savedAt: doc.updatedAt
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch legal documents',
      error: error.message
    });
  }
});

export default router;

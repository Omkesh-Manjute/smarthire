import mongoose from 'mongoose';

const verificationCheckSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['gps', 'ip', 'selfie', 'video', 'document', 'linkedin'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'skipped'],
    default: 'pending'
  },
  score: {
    type: Number,
    min: 0,
    max: 30
  },
  data: {
    type: mongoose.Schema.Types.Mixed // Flexible data storage
  },
  completedAt: {
    type: Date
  }
});

const candidateSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Professional Info
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true
  },
  experience: {
    type: Number,
    min: 0,
    max: 50
  },
  skills: [{
    type: String,
    trim: true
  }],
  
  // Location
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'USA' },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Trust Score
  trustScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'trusted', 'medium_risk', 'high_risk', 'rejected'],
    default: 'pending'
  },
  
  // Verification Data
  verification: {
    checks: [verificationCheckSchema],
    startedAt: Date,
    completedAt: Date,
    linkSentAt: Date,
    linkExpiresAt: Date,
    verificationLink: String,
    token: String
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['passport', 'driving_license', 'national_id', 'work_permit', 'visa', 'other']
    },
    url: String,
    verified: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Media
  selfieUrl: String,
  videoUrl: String,
  linkedInUrl: String,
  
  // Recruiter attribution & referral tracking
  referredByRecruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referredByRecruiterName: {
    type: String,
    trim: true
  },
  recruiterRefCode: {
    type: String,
    trim: true
  },
  
  // Recruiter who created or owns this candidate
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  // Fraud flags
  fraudFlags: [{
    type: {
      type: String,
      enum: ['location_mismatch', 'identity_theft', 'document_fraud', 'impersonation', 'proxy_detected']
    },
    description: String,
    detectedAt: {
      type: Date,
      default: Date.now
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  
  // Notes
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Active status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
candidateSchema.index({ email: 1 });
candidateSchema.index({ createdBy: 1 });
candidateSchema.index({ status: 1 });
candidateSchema.index({ trustScore: -1 });
candidateSchema.index({ 'verification.token': 1 });

// Calculate trust score based on verification checks
candidateSchema.methods.calculateTrustScore = function() {
  const weights = {
    gps: 30,
    ip: 20,
    selfie: 10,
    video: 10,
    document: 20,
    linkedin: 10
  };
  
  let totalScore = 0;
  
  this.verification.checks.forEach(check => {
    if (check.status === 'completed' && check.score) {
      totalScore += check.score;
    }
  });
  
  this.trustScore = Math.min(100, totalScore);
  
  // Update status based on score
  if (this.trustScore >= 80) {
    this.status = 'trusted';
  } else if (this.trustScore >= 50) {
    this.status = 'medium_risk';
  } else if (this.trustScore > 0) {
    this.status = 'high_risk';
  }
  
  return this.trustScore;
};

// Virtual for verification progress
candidateSchema.virtual('verificationProgress').get(function() {
  if (!this.verification.checks || this.verification.checks.length === 0) return 0;
  
  const completed = this.verification.checks.filter(
    check => check.status === 'completed'
  ).length;
  
  return Math.round((completed / this.verification.checks.length) * 100);
});

// Method to get score breakdown
candidateSchema.methods.getScoreBreakdown = function() {
  const breakdown = {
    gps: 0,
    ip: 0,
    selfie: 0,
    video: 0,
    document: 0,
    linkedin: 0
  };
  
  this.verification.checks.forEach(check => {
    if (check.status === 'completed' && check.score) {
      breakdown[check.type] = check.score;
    }
  });
  
  return breakdown;
};

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;

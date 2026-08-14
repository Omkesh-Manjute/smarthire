import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
import candidateRoutes from './routes/candidates.js';
import verificationRoutes from './routes/verification.js';
import userRoutes from './routes/users.js';
import linkedinPostsRoutes from './routes/linkedin_posts.js';
import messageRoutes from './routes/messages.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware (configured to allow cross-origin resource sharing for assets)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any localhost origin
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Fallback to env or default
    const allowed = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (origin === allowed) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'VerifyHire API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/linkedin-posts', linkedinPostsRoutes);
app.use('/api/messages', messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI not set. Running without database...');
      console.warn('   Set MONGODB_URI in .env file to enable database features.');
    } else {
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 VerifyHire API Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`\n📋 Available endpoints:`);
      console.log(`   POST /api/auth/register     - Register new user`);
      console.log(`   POST /api/auth/login        - User login`);
      console.log(`   GET  /api/candidates        - Get all candidates`);
      console.log(`   POST /api/candidates        - Create candidate`);
      console.log(`   GET  /api/verification/send - Send verification link`);
      console.log(`   GET  /api/health            - Health check`);
      console.log(`\n⚡ Press Ctrl+C to stop\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  // Close server & exit process
  process.exit(1);
});

startServer();

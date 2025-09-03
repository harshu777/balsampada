// SECURE VERSION OF SERVER.JS - Use this for production
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
require('dotenv').config();

// Import security configuration
const {
  authLimiter,
  apiLimiter,
  uploadLimiter,
  corsOptions,
  helmetConfig,
  sessionConfig,
  mongoOptions,
  securityChecks,
  validateEnvironment
} = require('./config/security');

// Validate environment variables
validateEnvironment();

// Import passport configuration
const passport = require('./config/passport');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const classRoutes = require('./routes/class.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const paymentRoutes = require('./routes/payment.routes');
const uploadRoutes = require('./routes/upload.routes');
const adminRoutes = require('./routes/admin.routes');
const liveClassRoutes = require('./routes/liveClass.routes');
const studyMaterialRoutes = require('./routes/studyMaterial.routes');
const progressRoutes = require('./routes/progress.routes');
const gradeRoutes = require('./routes/grade.routes');
const subjectRoutes = require('./routes/subject.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const organizationRoutes = require('./routes/organization.routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy (needed for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(securityChecks);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Session configuration with MongoDB store
app.use(session({
  ...sessionConfig,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // lazy session update
  })
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Body parsing middleware with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined')); // Apache combined log format
} else {
  app.use(morgan('dev'));
}

// Rate limiting for different routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api/', apiLimiter);

// Serve static files with security headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  dotfiles: 'deny',
  index: false,
  redirect: false
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/study-materials', studyMaterialRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/organizations', organizationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Balsampada LMS API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Security.txt endpoint
app.get('/.well-known/security.txt', (req, res) => {
  res.type('text/plain');
  res.send(`Contact: security@yourdomain.com
Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
Preferred-Languages: en
Canonical: https://yourdomain.com/.well-known/security.txt`);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
🚀 Balsampada LMS Server Started
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
🔒 Security: Enhanced
📅 Started: ${new Date().toISOString()}
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
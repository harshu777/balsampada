const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Import passport configuration
const passport = require('./config/passport');

// Use enhanced auth routes if available, otherwise fall back to original
let authRoutes;
try {
  authRoutes = require('./routes/auth.routes.enhanced');
  console.log('✅ Using enhanced JWT authentication');
} catch (error) {
  authRoutes = require('./routes/auth.routes');
  console.log('⚠️  Using standard authentication');
}
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

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(helmet());

// CORS configuration to allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://192.168.1.199:3001',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or postman)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin.split(':').slice(0, 2).join(':')))) {
      callback(null, true);
    } else {
      callback(null, true); // For development, allow all origins
    }
  },
  credentials: true
}));

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/api/', limiter);

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/balsampada-lms')
  .then(() => {
    console.log('Connected to MongoDB');
  }).catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Organization routes (before auth for signup)
const organizationRoutes = require('./routes/organization.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
app.use('/api/organizations', organizationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

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
app.use('/api/student-groups', require('./routes/studentGroup.routes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Balsampada LMS API is running' });
});

// Use our custom error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/**
 * UniApply Backend Server
 * Main entry point for the Express.js API server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const documentRoutes = require('./routes/documents');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const supportRoutes = require('./routes/support');

// Import database connection
// Use mock database if NO_DB environment variable is set
const db = process.env.NO_DB === 'true' 
  ? require('./config/database-mock')
  : require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redis client for sessions
let redisClient;
if (process.env.REDIS_HOST) {
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379
  });
  redisClient.connect().catch(console.error);

  // Session configuration with Redis
  app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.JWT_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }));
} else {
  // Fallback to memory store if Redis not available
  app.use(session({
    secret: process.env.JWT_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  }));
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'UniApply API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Initialize database and start server
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 UniApply Backend Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

module.exports = app;


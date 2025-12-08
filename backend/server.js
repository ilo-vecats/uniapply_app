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

// Import database ONCE (NO init, NO promise)
const db = process.env.NO_DB === 'true'
  ? require('./config/database-mock')
  : require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // Allow requests from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In production, allow all origins for now (you can restrict this later)
      if (process.env.NODE_ENV === 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redis client for sessions (optional)
let redisClient;
if (process.env.REDIS_HOST) {
  try {
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379
    });

    redisClient.connect().catch((err) => {
      console.warn('⚠️  Redis connection failed, using memory store:', err.message);
      redisClient = null;
    });
  } catch (err) {
    console.warn('⚠️  Redis setup failed, using memory store:', err.message);
    redisClient = null;
  }
}

if (redisClient) {

  app.use(session({
    store: new RedisStore({ client: redisClient }),
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

if (!redisClient) {
  // Fallback to memory store (development or no Redis)
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'UniApply API is running' });
});


app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);

// Error handler
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

// Test database connection and auto-migrate if needed
async function testDatabaseConnection() {
  try {
    const { query } = require('./config/database');
    await query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Check if users table exists, if not, run migration
    try {
      await query('SELECT 1 FROM users LIMIT 1');
      console.log('✅ Database tables exist');
    } catch (tableError) {
      if (tableError.message && tableError.message.includes('does not exist')) {
        console.log('⚠️  Database tables not found. Running migration...');
        try {
          const { init } = require('./config/database');
          await init();
          console.log('✅ Database migration completed successfully!');
        } catch (migrationError) {
          console.error('❌ Migration failed:', migrationError.message);
          console.error('⚠️  Please run: npm run migrate');
        }
      } else {
        throw tableError;
      }
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('⚠️  Make sure DB_URL is set correctly in environment variables.');
  }
}

// START SERVER
app.listen(PORT, async () => {
  console.log(`🚀 UniApply Backend Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  await testDatabaseConnection();
});

module.exports = app;

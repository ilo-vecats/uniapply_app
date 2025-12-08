/**
 * Authentication Routes
 * Handles user registration, login, and session management
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Register new user
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role = 'student' } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    let existingUser;
    try {
      existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    } catch (dbError) {
      console.error('❌ DB QUERY FAILED (check existing user):', dbError.message);
      console.error('Full error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please check if database tables exist.',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    let passwordHash;
    try {
      passwordHash = await bcrypt.hash(password, 10);
    } catch (bcryptError) {
      console.error('❌ BCRYPT HASH FAILED:', bcryptError);
      return res.status(500).json({
        success: false,
        message: 'Password encryption failed'
      });
    }

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET MISSING');
      return res.status(500).json({
        success: false,
        message: 'Server misconfigured (JWT_SECRET missing)'
      });
    }

    // Create user
    let result;
    try {
      result = await query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, role, first_name, last_name`,
        [email, passwordHash, role, firstName, lastName, phone]
      );
    } catch (dbError) {
      console.error('❌ DB INSERT FAILED:', dbError.message);
      console.error('Full error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user. Database error occurred.',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    if (!result.rows || result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'User creation failed - no data returned'
      });
    }

    const user = result.rows[0];

    // Generate JWT token
    let token;
    try {
      token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
    } catch (jwtError) {
      console.error('❌ JWT SIGN FAILED:', jwtError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate authentication token'
      });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('❌ UNCAUGHT REGISTRATION ERROR:', error);
    console.error('Error stack:', error.stack);
    
    // Better error messages for common issues
    let errorMessage = 'Registration failed';
    if (error.message && error.message.includes('does not exist')) {
      errorMessage = 'Database tables not found. Please run migration: npm run migrate';
    } else if (error.message && error.message.includes('connection')) {
      errorMessage = 'Database connection error. Please check your database configuration.';
    } else if (error.message && error.message.includes('duplicate key')) {
      errorMessage = 'User with this email already exists';
    } else {
      errorMessage = error.message || 'An unexpected error occurred during registration';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    
    let result;
    try {
      result = await query(
        'SELECT id, email, password_hash, role, first_name, last_name FROM users WHERE email = $1',
        [email]
      );
    } catch (dbError) {
      console.error('❌ DB QUERY FAILED:', dbError.message);
      console.error('Full error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please check if database tables exist.',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    if (!result.rows.length) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];


    if (!user.password_hash) {
      console.error('❌ USER HAS NO PASSWORD HASH:', user.email);
      return res.status(500).json({
        success: false,
        message: 'User password data corrupted'
      });
    }


    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } catch (bcryptError) {
      console.error('❌ BCRYPT FAILED:', bcryptError);
      return res.status(500).json({
        success: false,
        message: 'Password verification failed'
      });
    }

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

 
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET MISSING');
      return res.status(500).json({
        success: false,
        message: 'Server misconfigured (JWT_SECRET missing)'
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

   
    if (req.session) {
      req.session.userId = user.id;
      req.session.userRole = user.role;
    }

    delete user.password_hash;

    return res.json({
      success: true,
      message: 'Login successful',
      data: { user, token }
    });

  } catch (error) {
    console.error('❌ UNCAUGHT LOGIN ERROR:', error);
    console.error('Error stack:', error.stack);
    
    // Better error messages for common issues
    let errorMessage = 'Login failed';
    if (error.message && error.message.includes('does not exist')) {
      errorMessage = 'Database tables not found. Please run migration: npm run migrate';
    } else if (error.message && error.message.includes('connection')) {
      errorMessage = 'Database connection error. Please check your database configuration.';
    } else {
      errorMessage = error.message || 'An unexpected error occurred';
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, role, first_name, last_name, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

/**
 * Logout user
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
});

module.exports = router;


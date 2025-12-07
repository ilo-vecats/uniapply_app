/**
 * Database Configuration
 * PostgreSQL connection and initialization
 */

const { Pool } = require('pg');
require('dotenv').config();

// Support both DATABASE_URL (cloud) and individual components (local)
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('neon') || process.env.DATABASE_URL.includes('supabase') 
        ? { rejectUnauthorized: false } 
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'uniapply_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

/**
 * Initialize database tables
 * Creates all necessary tables if they don't exist
 */
async function init() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create universities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        location VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create programs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS programs (
        id SERIAL PRIMARY KEY,
        university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        degree_type VARCHAR(50),
        duration INTEGER,
        application_fee DECIMAL(10, 2) DEFAULT 0,
        eligibility_criteria JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(university_id, code)
      )
    `);

    // Create applications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        application_id VARCHAR(50) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'draft',
        personal_info JSONB,
        academic_history JSONB,
        ai_verification_status VARCHAR(50) DEFAULT 'pending',
        ai_verification_result JSONB,
        admin_verification_status VARCHAR(50) DEFAULT 'pending',
        admin_notes TEXT,
        issue_raised BOOLEAN DEFAULT FALSE,
        issue_details TEXT,
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_amount DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create documents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
        document_type VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        ai_extracted_data JSONB,
        ai_verification_status VARCHAR(50) DEFAULT 'pending',
        admin_verification_status VARCHAR(50) DEFAULT 'pending',
        admin_notes TEXT,
        is_rejected BOOLEAN DEFAULT FALSE,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create required_documents table (admin configurable)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS required_documents (
        id SERIAL PRIMARY KEY,
        program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
        document_type VARCHAR(100) NOT NULL,
        is_required BOOLEAN DEFAULT TRUE,
        is_optional BOOLEAN DEFAULT FALSE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(program_id, document_type)
      )
    `);

    // Create payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        payment_id VARCHAR(100) UNIQUE NOT NULL,
        application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        payment_type VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        transaction_id VARCHAR(255),
        payment_gateway_response JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create support_tickets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        ticket_id VARCHAR(50) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL,
        subject VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        priority VARCHAR(50) DEFAULT 'medium',
        admin_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
      CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
      CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

/**
 * Query helper function
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  init
};


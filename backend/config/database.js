
const { Pool } = require("pg");
require("dotenv").config();

// Require DB_URL explicitly (prevents silent localhost fallback)
if (!process.env.DB_URL) {
  console.error("❌ DB_URL is missing in environment variables.");
  process.exit(1);
}

// Clean up connection string for Neon compatibility
// Remove channel_binding=require if present (causes issues with Neon)
let connectionString = process.env.DB_URL;
if (connectionString && connectionString.includes('channel_binding=require')) {
  // Remove both ?channel_binding=require and &channel_binding=require
  connectionString = connectionString
    .replace(/[&?]channel_binding=require/g, '')
    .replace(/channel_binding=require[&?]/g, '')
    .replace(/channel_binding=require$/, '');
  console.log('⚠️  Removed channel_binding=require from connection string for Neon compatibility');
}

// Create connection pool optimized for Neon
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased for serverless databases
  statement_timeout: 30000, // 30 second statement timeout
});

// Connection success
pool.on("connect", () => {
  console.log("Connected to PostgreSQL (Neon)");
});

// Connection failure
pool.on("error", (err) => {
  console.error("Database connection error:", err);
  process.exit(1);
});


async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", {
      text,
      duration: `${duration}ms`,
      rows: res.rowCount,
    });
    return res;
  } catch (error) {
    console.error("❌ Query error:", error.message);
    console.error("Query:", text.substring(0, 100));
    throw error;
  }
}

// Initialize database - creates all tables
async function init() {
  try {
    console.log('🔧 Initializing database...');
    
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'student',
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create universities table
    await query(`
      CREATE TABLE IF NOT EXISTS universities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Universities table created');

    // Create programs table
    await query(`
      CREATE TABLE IF NOT EXISTS programs (
        id SERIAL PRIMARY KEY,
        university_id INTEGER REFERENCES universities(id),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        degree_type VARCHAR(50),
        duration INTEGER,
        application_fee DECIMAL(10,2) DEFAULT 0,
        eligibility_criteria JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(university_id, code)
      )
    `);
    console.log('✅ Programs table created');

    // Create applications table
    await query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        application_id VARCHAR(50) UNIQUE,
        user_id INTEGER REFERENCES users(id),
        program_id INTEGER REFERENCES programs(id),
        status VARCHAR(50) DEFAULT 'draft',
        personal_info JSONB,
        academic_info JSONB,
        academic_history JSONB,
        ai_verification_status VARCHAR(50),
        ai_verification_result JSONB,
        admin_verification_status VARCHAR(50),
        issue_raised BOOLEAN DEFAULT false,
        issue_details TEXT,
        submitted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Applications table created');

    // Create documents table
    await query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        application_id INTEGER REFERENCES applications(id),
        document_type VARCHAR(255) NOT NULL,
        file_path VARCHAR(500),
        file_name VARCHAR(255),
        file_size INTEGER,
        mime_type VARCHAR(100),
        extracted_data JSONB,
        ai_verification_status VARCHAR(50),
        ai_confidence DECIMAL(5,2),
        admin_verification_status VARCHAR(50),
        admin_notes TEXT,
        is_rejected BOOLEAN DEFAULT false,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Documents table created');

    // Create required_documents table
    await query(`
      CREATE TABLE IF NOT EXISTS required_documents (
        id SERIAL PRIMARY KEY,
        program_id INTEGER REFERENCES programs(id),
        document_type VARCHAR(255) NOT NULL,
        is_required BOOLEAN DEFAULT true,
        is_optional BOOLEAN DEFAULT false,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(program_id, document_type)
      )
    `);
    console.log('✅ Required documents table created');

    // Create payments table
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        payment_id VARCHAR(100) UNIQUE,
        user_id INTEGER REFERENCES users(id),
        application_id INTEGER REFERENCES applications(id),
        payment_type VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(50) DEFAULT 'pending',
        transaction_id VARCHAR(255),
        payment_gateway VARCHAR(50),
        payment_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Payments table created');

    // Create support_tickets table
    await query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        application_id INTEGER REFERENCES applications(id),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        priority VARCHAR(50) DEFAULT 'medium',
        admin_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Support tickets table created');

    console.log('🎉 Database initialization completed!');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  init,
};

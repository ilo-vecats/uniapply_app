/**
 * Database Migration Script
 * Creates all necessary tables in the database
 */

require('dotenv').config();
const { init } = require('../config/database');

async function migrate() {
  try {
    console.log('🚀 Starting database migration...');
    await init();
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();


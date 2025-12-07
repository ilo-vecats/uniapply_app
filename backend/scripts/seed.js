/**
 * Database Seed Script
 * Populates database with initial data (universities, programs, admin user)
 */

require('dotenv').config();
const { init, query } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Initialize database
    await init();

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['admin@uniapply.com', adminPassword, 'admin', 'Admin', 'User']
    );
    console.log('✅ Admin user created (email: admin@uniapply.com, password: admin123)');

    // Create sample universities
    const universities = [
      { name: 'IIT Delhi', code: 'IITD', location: 'New Delhi' },
      { name: 'IIT Bombay', code: 'IITB', location: 'Mumbai' },
      { name: 'IIT Madras', code: 'IITM', location: 'Chennai' },
      { name: 'BITS Pilani', code: 'BITSP', location: 'Pilani' },
      { name: 'NIT Trichy', code: 'NITT', location: 'Trichy' }
    ];

    for (const uni of universities) {
      const result = await query(
        `INSERT INTO universities (name, code, location)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO NOTHING
         RETURNING id`,
        [uni.name, uni.code, uni.location]
      );
      if (result.rows.length > 0) {
        console.log(`✅ Created university: ${uni.name}`);
      }
    }

    // Get university IDs
    const uniResult = await query('SELECT id, code FROM universities');
    const uniMap = {};
    uniResult.rows.forEach(u => { uniMap[u.code] = u.id; });

    // Create sample programs
    const programs = [
      {
        universityCode: 'IITD',
        name: 'M.Tech Computer Science',
        code: 'MTECH_CS',
        degreeType: 'M.Tech',
        duration: 2,
        applicationFee: 3000,
        eligibility: { minPercentage: 70, degree: 'B.Tech' }
      },
      {
        universityCode: 'IITB',
        name: 'M.Tech Data Science',
        code: 'MTECH_DS',
        degreeType: 'M.Tech',
        duration: 2,
        applicationFee: 3500,
        eligibility: { minPercentage: 75, degree: 'B.Tech' }
      },
      {
        universityCode: 'IITB',
        name: 'MBA',
        code: 'MBA',
        degreeType: 'MBA',
        duration: 2,
        applicationFee: 2500,
        eligibility: { minPercentage: 60, degree: 'Any' }
      },
      {
        universityCode: 'BITSP',
        name: 'M.Tech Software Engineering',
        code: 'MTECH_SE',
        degreeType: 'M.Tech',
        duration: 2,
        applicationFee: 2000,
        eligibility: { minPercentage: 65, degree: 'B.Tech' }
      },
      {
        universityCode: 'NITT',
        name: 'M.Tech AI & ML',
        code: 'MTECH_AI',
        degreeType: 'M.Tech',
        duration: 2,
        applicationFee: 2000,
        eligibility: { minPercentage: 70, degree: 'B.Tech' }
      }
    ];

    for (const prog of programs) {
      const uniId = uniMap[prog.universityCode];
      if (!uniId) continue;

      const result = await query(
        `INSERT INTO programs (university_id, name, code, degree_type, duration, application_fee, eligibility_criteria)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (university_id, code) DO NOTHING
         RETURNING id`,
        [uniId, prog.name, prog.code, prog.degreeType, prog.duration, prog.applicationFee, JSON.stringify(prog.eligibility)]
      );
      if (result.rows.length > 0) {
        console.log(`✅ Created program: ${prog.name}`);
      }
    }

    // Get program IDs and create required documents
    const progResult = await query('SELECT id, code FROM programs');
    const documentTypes = ['10th Marksheet', '12th Marksheet', 'Aadhar Card', 'Graduation Certificate'];

    for (const prog of progResult.rows) {
      for (const docType of documentTypes) {
        const isRequired = !docType.includes('Graduation') || prog.code.includes('MTECH');
        await query(
          `INSERT INTO required_documents (program_id, document_type, is_required, is_optional)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (program_id, document_type) DO NOTHING`,
          [prog.id, docType, isRequired, !isRequired]
        );
      }
    }
    console.log('✅ Created required documents configuration');

    console.log('🎉 Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();


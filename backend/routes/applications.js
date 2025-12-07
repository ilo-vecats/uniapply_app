/**
 * Application Routes
 * Handles student application creation, updates, and status tracking
 */

const express = require('express');
const { query } = require('../config/database');
const { authenticate, requireStudent } = require('../middleware/auth');

const router = express.Router();

/**
 * Generate unique application ID
 */
function generateApplicationId() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `APP-${year}${month}-${random}`;
}

/**
 * Create new application
 * POST /api/applications
 */
router.post('/', authenticate, requireStudent, async (req, res) => {
  try {
    const { programId, personalInfo, academicHistory } = req.body;

    if (!programId) {
      return res.status(400).json({ success: false, message: 'Program ID is required' });
    }

    // Verify program exists
    const programResult = await query('SELECT * FROM programs WHERE id = $1', [programId]);
    if (programResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    const applicationId = generateApplicationId();

    // Create application
    const result = await query(
      `INSERT INTO applications 
       (application_id, user_id, program_id, personal_info, academic_history, status)
       VALUES ($1, $2, $3, $4, $5, 'draft')
       RETURNING *`,
      [
        applicationId,
        req.user.id,
        programId,
        JSON.stringify(personalInfo || {}),
        JSON.stringify(academicHistory || {})
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ success: false, message: 'Failed to create application', error: error.message });
  }
});

/**
 * Get all applications for current user
 * GET /api/applications
 */
router.get('/', authenticate, requireStudent, async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, p.name as program_name, p.code as program_code, 
              u.name as university_name, u.code as university_code
       FROM applications a
       JOIN programs p ON a.program_id = p.id
       JOIN universities u ON p.university_id = u.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to get applications' });
  }
});

/**
 * Get single application by ID
 * GET /api/applications/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT a.*, p.name as program_name, p.code as program_code, 
              u.name as university_name, u.code as university_code,
              u.first_name, u.last_name, u.email
       FROM applications a
       JOIN programs p ON a.program_id = p.id
       JOIN universities u ON p.university_id = u.id
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = result.rows[0];

    // Check access: students can only see their own, admins can see all
    if (req.user.role === 'student' && application.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ success: false, message: 'Failed to get application' });
  }
});

/**
 * Update application
 * PUT /api/applications/:id
 */
router.put('/:id', authenticate, requireStudent, async (req, res) => {
  try {
    const { id } = req.params;
    const { personalInfo, academicHistory, status } = req.body;

    // Verify application belongs to user
    const appResult = await query(
      'SELECT user_id, status FROM applications WHERE id = $1',
      [id]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (appResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (personalInfo) {
      updates.push(`personal_info = $${paramCount}`);
      values.push(JSON.stringify(personalInfo));
      paramCount++;
    }

    if (academicHistory) {
      updates.push(`academic_history = $${paramCount}`);
      values.push(JSON.stringify(academicHistory));
      paramCount++;
    }

    if (status && ['draft', 'submitted'].includes(status)) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE applications 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ success: false, message: 'Failed to update application', error: error.message });
  }
});

/**
 * Submit application
 * POST /api/applications/:id/submit
 */
router.post('/:id/submit', authenticate, requireStudent, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify application belongs to user and is in draft status
    const appResult = await query(
      'SELECT user_id, status FROM applications WHERE id = $1',
      [id]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (appResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (appResult.rows[0].status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Application already submitted' });
    }

    // Check if required documents are uploaded
    const requiredDocsResult = await query(
      `SELECT rd.document_type, rd.is_required
       FROM required_documents rd
       JOIN applications a ON rd.program_id = a.program_id
       WHERE a.id = $1 AND rd.is_required = true`,
      [id]
    );

    const docsResult = await query(
      'SELECT document_type FROM documents WHERE application_id = $1',
      [id]
    );

    const uploadedTypes = docsResult.rows.map(d => d.document_type);
    const missingDocs = requiredDocsResult.rows
      .filter(rd => !uploadedTypes.includes(rd.document_type))
      .map(rd => rd.document_type);

    if (missingDocs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required documents',
        missingDocuments: missingDocs
      });
    }

    // Update application status to submitted
    const result = await query(
      `UPDATE applications 
       SET status = 'submitted', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application', error: error.message });
  }
});

module.exports = router;


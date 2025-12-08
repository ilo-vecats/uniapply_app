/**
 * Admin Routes
 * Handles admin operations: verification, document management, analytics
 */

const express = require('express');
const { query } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * Get all applications with filters
 * GET /api/admin/applications
 */
router.get('/applications', async (req, res) => {
  try {
    const { status, aiStatus, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT a.*, 
             u.first_name, u.last_name, u.email,
             p.name as program_name, p.code as program_code,
             un.name as university_name
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN programs p ON a.program_id = p.id
      JOIN universities un ON p.university_id = un.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (aiStatus) {
      queryText += ` AND a.ai_verification_status = $${paramCount}`;
      params.push(aiStatus);
      paramCount++;
    }

    queryText += ` ORDER BY a.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rowCount || 0
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get application details for review
 * GET /api/admin/applications/:id
 */
router.get('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get application with all related data
    const appResult = await query(
      `SELECT a.*, 
              u.first_name, u.last_name, u.email, u.phone,
              p.name as program_name, p.code as program_code, p.application_fee,
              un.name as university_name,
              CASE 
                WHEN a.ai_verification_result IS NOT NULL 
                THEN a.ai_verification_result::text::jsonb
                ELSE NULL
              END as ai_verification_result
       FROM applications a
       JOIN users u ON a.user_id = u.id
       JOIN programs p ON a.program_id = p.id
       JOIN universities un ON p.university_id = un.id
       WHERE a.id = $1`,
      [id]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Get documents
    const docsResult = await query(
      'SELECT * FROM documents WHERE application_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      success: true,
      data: {
        application: appResult.rows[0],
        documents: docsResult.rows
      }
    });
  } catch (error) {
    console.error('Get application details error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get application details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Verify document (Level 2 - Manual verification)
 * POST /api/admin/documents/:id/verify
 */
router.post('/documents/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // status: 'verified' or 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await query(
      `UPDATE documents 
       SET admin_verification_status = $1,
           admin_notes = $2,
           is_rejected = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, notes || null, status === 'rejected', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Check if all documents are verified
    const appId = result.rows[0].application_id;
    const allDocsResult = await query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN admin_verification_status = 'verified' THEN 1 END) as verified
       FROM documents 
       WHERE application_id = $1`,
      [appId]
    );

    const { total, verified } = allDocsResult.rows[0];

    // If all documents verified, update application status
    if (parseInt(verified) === parseInt(total) && parseInt(total) > 0) {
      await query(
        `UPDATE applications 
         SET admin_verification_status = 'verified',
             status = 'verified',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [appId]
      );
    }

    res.json({
      success: true,
      message: `Document ${status} successfully`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify document', error: error.message });
  }
});

/**
 * Raise issue on application
 * POST /api/admin/applications/:id/raise-issue
 */
router.post('/applications/:id/raise-issue', async (req, res) => {
  try {
    const { id } = req.params;
    const { issueDetails } = req.body;

    if (!issueDetails) {
      return res.status(400).json({ success: false, message: 'Issue details are required' });
    }

    const result = await query(
      `UPDATE applications 
       SET issue_raised = true,
           issue_details = $1,
           status = 'issue_raised',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [issueDetails, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({
      success: true,
      message: 'Issue raised successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Raise issue error:', error);
    res.status(500).json({ success: false, message: 'Failed to raise issue', error: error.message });
  }
});

/**
 * Approve application
 * POST /api/admin/applications/:id/approve
 */
router.post('/applications/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE applications 
       SET admin_verification_status = 'verified',
           status = 'verified',
           issue_raised = false,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({
      success: true,
      message: 'Application approved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve application', error: error.message });
  }
});

/**
 * Get dashboard analytics
 * GET /api/admin/analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    // Get application status counts
    let statusCounts = { rows: [] };
    try {
      statusCounts = await query(`
        SELECT status, COUNT(*) as count
        FROM applications
        GROUP BY status
      `);
    } catch (err) {
      console.error('Error getting status counts:', err.message);
    }

    // Get AI verification status counts
    let aiStatusCounts = { rows: [] };
    try {
      aiStatusCounts = await query(`
        SELECT COALESCE(ai_verification_status, 'not_processed') as ai_verification_status, COUNT(*) as count
        FROM applications
        GROUP BY ai_verification_status
      `);
    } catch (err) {
      console.error('Error getting AI status counts:', err.message);
    }

    // Get total revenue (handle if payments table is empty)
    let revenueResult = { rows: [{ application_fee_revenue: 0, issue_resolution_revenue: 0, total_transactions: 0 }] };
    try {
      revenueResult = await query(`
        SELECT 
          COALESCE(SUM(CASE WHEN payment_type = 'application_fee' AND status = 'completed' THEN amount ELSE 0 END), 0) as application_fee_revenue,
          COALESCE(SUM(CASE WHEN payment_type = 'issue_resolution' AND status = 'completed' THEN amount ELSE 0 END), 0) as issue_resolution_revenue,
          COUNT(*) as total_transactions
        FROM payments
      `);
    } catch (err) {
      console.error('Error getting revenue:', err.message);
    }

    // Get recent applications (last 7 days)
    let recentApps = { rows: [{ count: '0' }] };
    try {
      recentApps = await query(`
        SELECT COUNT(*) as count
        FROM applications
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      `);
    } catch (err) {
      console.error('Error getting recent apps:', err.message);
    }

    // Get total applications
    let totalApplications = 0;
    try {
      const totalResult = await query('SELECT COUNT(*) as count FROM applications');
      totalApplications = parseInt(totalResult.rows[0]?.count || 0);
    } catch (err) {
      console.error('Error getting total applications:', err.message);
    }

    // Get pending review count
    let pendingReview = 0;
    try {
      const pendingResult = await query(`
        SELECT COUNT(*) as count 
        FROM applications 
        WHERE status IN ('submitted', 'under_review')
      `);
      pendingReview = parseInt(pendingResult.rows[0]?.count || 0);
    } catch (err) {
      console.error('Error getting pending review:', err.message);
    }

    // Get open tickets count
    let openTickets = 0;
    try {
      const ticketsResult = await query(`
        SELECT COUNT(*) as count 
        FROM support_tickets 
        WHERE status = 'open'
      `);
      openTickets = parseInt(ticketsResult.rows[0]?.count || 0);
    } catch (err) {
      console.error('Error getting open tickets:', err.message);
    }

    res.json({
      success: true,
      data: {
        statusCounts: statusCounts.rows || [],
        aiStatusCounts: aiStatusCounts.rows || [],
        revenue: revenueResult.rows[0] || {
          application_fee_revenue: 0,
          issue_resolution_revenue: 0,
          total_transactions: 0
        },
        recentApplications: parseInt(recentApps.rows[0]?.count || 0),
        totalApplications,
        pendingReview,
        openTickets
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    console.error('Full error:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get all students
 * GET /api/admin/students
 */
router.get('/students', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
              COUNT(a.id) as total_applications
       FROM users u
       LEFT JOIN applications a ON u.id = a.user_id
       WHERE u.role = 'student'
       GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at
       ORDER BY u.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'Failed to get students' });
  }
});

/**
 * Get all universities
 * GET /api/admin/universities
 */
router.get('/universities', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.*, COUNT(p.id) as programs_count
       FROM universities u
       LEFT JOIN programs p ON u.id = p.university_id
       GROUP BY u.id
       ORDER BY u.name`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get universities error:', error);
    res.status(500).json({ success: false, message: 'Failed to get universities' });
  }
});

/**
 * Get required documents for a program
 * GET /api/admin/programs/:programId/documents
 */
router.get('/programs/:programId/documents', async (req, res) => {
  try {
    const { programId } = req.params;

    const result = await query(
      `SELECT * FROM required_documents 
       WHERE program_id = $1 
       ORDER BY is_required DESC, document_type`,
      [programId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get required documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to get required documents', error: error.message });
  }
});

/**
 * Configure required documents for a program
 * POST /api/admin/programs/:programId/documents
 */
router.post('/programs/:programId/documents', async (req, res) => {
  try {
    const { programId } = req.params;
    const { documentType, isRequired, isOptional, description } = req.body;

    if (!documentType) {
      return res.status(400).json({ success: false, message: 'Document type is required' });
    }

    const result = await query(
      `INSERT INTO required_documents (program_id, document_type, is_required, is_optional, description)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (program_id, document_type)
       DO UPDATE SET is_required = $3, is_optional = $4, description = $5, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [programId, documentType, isRequired || false, isOptional || false, description || null]
    );

    res.json({
      success: true,
      message: 'Document requirement configured successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Configure document error:', error);
    res.status(500).json({ success: false, message: 'Failed to configure document', error: error.message });
  }
});

/**
 * Get programs list
 * GET /api/admin/programs
 */
router.get('/programs', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.name as university_name, u.code as university_code
       FROM programs p
       JOIN universities u ON p.university_id = u.id
       ORDER BY u.name, p.name`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({ success: false, message: 'Failed to get programs', error: error.message });
  }
});

module.exports = router;


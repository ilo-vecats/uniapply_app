/**
 * Document Routes
 * Handles document upload, AI processing, and verification
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { query } = require('../config/database');
const { authenticate, requireStudent } = require('../middleware/auth');
const { processDocument } = require('../services/aiService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, JPG, and PNG files are allowed'));
    }
  }
});

/**
 * Upload document for application
 * POST /api/documents/upload
 */
router.post('/upload', authenticate, requireStudent, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { applicationId, documentType } = req.body;

    if (!applicationId || !documentType) {
      // Delete uploaded file if validation fails
      await fs.unlink(req.file.path);
      return res.status(400).json({ success: false, message: 'Application ID and document type are required' });
    }

    // Get application data for verification
    const appResult = await query(
      `SELECT a.*, u.first_name, u.last_name, u.email 
       FROM applications a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = $1 AND a.user_id = $2`,
      [applicationId, req.user.id]
    );

    if (appResult.rows.length === 0) {
      await fs.unlink(req.file.path);
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = appResult.rows[0];

    // Parse JSONB fields
    const personalInfo = typeof application.personal_info === 'string' 
      ? JSON.parse(application.personal_info) 
      : (application.personal_info || {});

    // Process document with AI
    const aiResult = await processDocument(
      documentType,
      req.file.path,
      {
        firstName: application.first_name,
        lastName: application.last_name,
        dateOfBirth: personalInfo.dateOfBirth || personalInfo.dob || null,
        minPercentage: application.program_id ? await getMinPercentage(application.program_id) : null
      }
    );

    // Save document to database
    const docResult = await query(
      `INSERT INTO documents 
       (application_id, document_type, file_name, file_path, file_size, mime_type, extracted_data, ai_verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        applicationId,
        documentType,
        req.file.filename,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        JSON.stringify(aiResult.extractedData || {}),
        aiResult.verification.isValid ? 'verified' : 'flagged'
      ]
    );

    // Update application AI verification status
    if (aiResult.verification.isValid) {
      await query(
        `UPDATE applications 
         SET ai_verification_status = 'verified',
             ai_verification_result = $1
         WHERE id = $2`,
        [JSON.stringify(aiResult.verification), applicationId]
      );
    } else {
      await query(
        `UPDATE applications 
         SET ai_verification_status = 'flagged',
             ai_verification_result = $1
         WHERE id = $2`,
        [JSON.stringify(aiResult.verification), applicationId]
      );
    }

    res.json({
      success: true,
      message: 'Document uploaded and processed successfully',
      data: {
        document: docResult.rows[0],
        aiExtraction: aiResult.extractedData,
        verification: aiResult.verification
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({ success: false, message: 'Document upload failed', error: error.message });
  }
});

/**
 * Get documents for an application
 * GET /api/documents/:applicationId
 */
router.get('/:applicationId', authenticate, async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Check if user has access to this application
    const appResult = await query(
      'SELECT user_id FROM applications WHERE id = $1',
      [applicationId]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Students can only see their own documents, admins can see all
    if (req.user.role === 'student' && appResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await query(
      'SELECT * FROM documents WHERE application_id = $1 ORDER BY created_at DESC',
      [applicationId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to get documents' });
  }
});

/**
 * Helper function to get minimum percentage requirement
 */
async function getMinPercentage(programId) {
  try {
    const result = await query(
      'SELECT eligibility_criteria FROM programs WHERE id = $1',
      [programId]
    );
    return result.rows[0]?.eligibility_criteria?.minPercentage || null;
  } catch (error) {
    return null;
  }
}

module.exports = router;


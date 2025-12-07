/**
 * Support Ticket Routes
 * Handles support ticket creation and management
 */

const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * Generate unique ticket ID
 */
function generateTicketId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TKT-${timestamp}-${random}`;
}

/**
 * Create support ticket
 * POST /api/support/tickets
 */
router.post('/tickets', authenticate, async (req, res) => {
  try {
    const { subject, category, description, applicationId } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject and description are required' });
    }

    const ticketId = generateTicketId();

    const result = await query(
      `INSERT INTO support_tickets 
       (ticket_id, user_id, application_id, subject, category, description, status, priority)
       VALUES ($1, $2, $3, $4, $5, $6, 'open', 'medium')
       RETURNING *`,
      [ticketId, req.user.id, applicationId || null, subject, category || 'general', description]
    );

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ticket', error: error.message });
  }
});

/**
 * Get tickets for current user
 * GET /api/support/tickets
 */
router.get('/tickets', authenticate, async (req, res) => {
  try {
    const queryText = req.user.role === 'admin'
      ? `SELECT t.*, u.first_name, u.last_name, u.email 
         FROM support_tickets t
         JOIN users u ON t.user_id = u.id
         ORDER BY t.created_at DESC`
      : `SELECT * FROM support_tickets 
         WHERE user_id = $1 
         ORDER BY created_at DESC`;

    const params = req.user.role === 'admin' ? [] : [req.user.id];
    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tickets' });
  }
});

/**
 * Update ticket (admin response)
 * PUT /api/support/tickets/:id
 */
router.put('/tickets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse, priority } = req.body;

    // Check if user has access
    const ticketResult = await query(
      'SELECT user_id FROM support_tickets WHERE id = $1',
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Only admin can update status/response, users can only view
    if (status || adminResponse) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (status) {
        updates.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      if (adminResponse) {
        updates.push(`admin_response = $${paramCount}`);
        values.push(adminResponse);
        paramCount++;
      }

      if (priority) {
        updates.push(`priority = $${paramCount}`);
        values.push(priority);
        paramCount++;
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await query(
        `UPDATE support_tickets 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      res.json({
        success: true,
        message: 'Ticket updated successfully',
        data: result.rows[0]
      });
    } else {
      // User can only view their own tickets
      if (ticketResult.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      res.json({
        success: true,
        data: ticketResult.rows[0]
      });
    }
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket', error: error.message });
  }
});

module.exports = router;


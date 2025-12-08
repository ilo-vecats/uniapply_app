/**
 * Payment Routes
 * Handles payment processing for application fees and issue resolution
 */

const express = require('express');
const { query } = require('../config/database');
const { authenticate, requireStudent } = require('../middleware/auth');

const router = express.Router();

/**
 * Generate unique payment ID
 */
function generatePaymentId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `PAY-${timestamp}-${random}`;
}

/**
 * Create payment for application fee
 * POST /api/payments/application-fee
 */
router.post('/application-fee', authenticate, requireStudent, async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ success: false, message: 'Application ID is required' });
    }

    // Get application and program details
    const appResult = await query(
      `SELECT a.*, p.application_fee, p.name as program_name
       FROM applications a
       JOIN programs p ON a.program_id = p.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [applicationId, req.user.id]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = appResult.rows[0];

    if (application.status !== 'verified') {
      return res.status(400).json({ 
        success: false, 
        message: 'Application must be verified before payment' 
      });
    }

    // Check if payment already exists for this application
    const existingPayment = await query(
      `SELECT id FROM payments 
       WHERE application_id = $1 
       AND payment_type = 'application_fee' 
       AND status = 'completed'`,
      [applicationId]
    );

    if (existingPayment.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment already completed' 
      });
    }

    const paymentId = generatePaymentId();
    const amount = parseFloat(application.application_fee) || 0;

    // Create payment record
    const result = await query(
      `INSERT INTO payments 
       (payment_id, application_id, user_id, payment_type, amount, status)
       VALUES ($1, $2, $3, 'application_fee', $4, 'pending')
       RETURNING *`,
      [paymentId, applicationId, req.user.id, amount]
    );

    // In production, integrate with payment gateway (Razorpay, Stripe, etc.)
    // For now, return payment details for frontend to handle
    res.json({
      success: true,
      message: 'Payment initiated',
      data: {
        payment: result.rows[0],
        // Payment gateway integration would go here
        // For demo, we'll simulate payment
        paymentGateway: {
          key: process.env.RAZORPAY_KEY_ID || 'demo_key',
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          orderId: paymentId
        }
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment', error: error.message });
  }
});

/**
 * Create payment for issue resolution
 * POST /api/payments/issue-resolution
 */
router.post('/issue-resolution', authenticate, requireStudent, async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ success: false, message: 'Application ID is required' });
    }

    // Get application
    const appResult = await query(
      `SELECT * FROM applications 
       WHERE id = $1 AND user_id = $2 AND issue_raised = true`,
      [applicationId, req.user.id]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application with issue not found' 
      });
    }

    // Issue resolution fee (configurable, default 500)
    const issueResolutionFee = 500;
    const paymentId = generatePaymentId();

    // Create payment record
    const result = await query(
      `INSERT INTO payments 
       (payment_id, application_id, user_id, payment_type, amount, status)
       VALUES ($1, $2, $3, 'issue_resolution', $4, 'pending')
       RETURNING *`,
      [paymentId, applicationId, req.user.id, issueResolutionFee]
    );

    res.json({
      success: true,
      message: 'Issue resolution payment initiated',
      data: {
        payment: result.rows[0],
        paymentGateway: {
          key: process.env.RAZORPAY_KEY_ID || 'demo_key',
          amount: issueResolutionFee * 100,
          currency: 'INR',
          orderId: paymentId
        }
      }
    });
  } catch (error) {
    console.error('Issue resolution payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment', error: error.message });
  }
});

/**
 * Verify payment callback (from payment gateway)
 * POST /api/payments/verify
 */
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { paymentId, transactionId, status, gatewayResponse } = req.body;

    // Update payment status
    const result = await query(
      `UPDATE payments 
       SET status = $1,
           transaction_id = $2,
           payment_data = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE payment_id = $4
       RETURNING *`,
      [status, transactionId, JSON.stringify(gatewayResponse || {}), paymentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const payment = result.rows[0];

    // If payment successful, update application
    if (status === 'completed') {
      if (payment.payment_type === 'application_fee') {
        await query(
          `UPDATE applications 
           SET status = 'payment_received',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [payment.application_id]
        );
      } else if (payment.payment_type === 'issue_resolution') {
        // Allow student to view issue details and resubmit
        await query(
          `UPDATE applications 
           SET issue_raised = false,
               status = 'under_review',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [payment.application_id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Payment verified',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment', error: error.message });
  }
});

/**
 * Get payment history for user
 * GET /api/payments
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const queryText = req.user.role === 'admin' 
      ? 'SELECT * FROM payments ORDER BY created_at DESC'
      : 'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC';

    const params = req.user.role === 'admin' ? [] : [req.user.id];
    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payments' });
  }
});

module.exports = router;


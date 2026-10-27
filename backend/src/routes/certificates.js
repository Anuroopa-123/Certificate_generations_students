const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { generateCertificatePdf } = require('../services/pdfGenerator');

// Helper to generate unique certificate number: RT-INT-YYYY-XXXXX
async function generateUniqueCertNumber() {
  const currentYear = new Date().getFullYear();
  let unique = false;
  let certNum = '';

  while (!unique) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    certNum = `RT-INT-${currentYear}-${randomSuffix}`;
    const check = await db.query('SELECT id FROM certificates WHERE certificate_number = $1', [certNum]);
    if (check.rows.length === 0) {
      unique = true;
    }
  }
  return certNum;
}

// GET /api/certificates/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const totalResult = await db.query('SELECT COUNT(*) FROM certificates');
    const validResult = await db.query("SELECT COUNT(*) FROM certificates WHERE status = 'valid'");
    const totalDownloads = await db.query('SELECT COALESCE(SUM(download_count), 0) as total FROM certificates');
    const limitReached = await db.query('SELECT COUNT(*) FROM certificates WHERE download_count >= max_downloads');
    const pendingRequests = await db.query("SELECT COUNT(*) FROM download_reset_requests WHERE status = 'pending'");

    // Breakdown by duration/type
    const typeBreakdown = await db.query(
      `SELECT certificate_type, COUNT(*) as count 
       FROM certificates 
       GROUP BY certificate_type 
       ORDER BY count DESC`
    );

    // Recent activity
    const recentActivity = await db.query(
      `SELECT c.id, c.certificate_number, c.student_name, c.certificate_type, c.issue_date, c.status,
              c.download_count, c.max_downloads, u.name as issued_by_name
       FROM certificates c
       LEFT JOIN users u ON c.issued_by = u.id
       ORDER BY c.created_at DESC
       LIMIT 5`
    );

    res.json({
      total: parseInt(totalResult.rows[0].count, 10),
      valid: parseInt(validResult.rows[0].count, 10),
      totalDownloads: parseInt(totalDownloads.rows[0].total, 10),
      limitReached: parseInt(limitReached.rows[0].count, 10),
      pendingRequests: parseInt(pendingRequests.rows[0].count, 10),
      typeBreakdown: typeBreakdown.rows,
      recentActivity: recentActivity.rows
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

// GET /api/certificates (List certificates with search & filter)
router.get('/', authenticate, async (req, res) => {
  try {
    const { search = '', type = '', status = '', limit = 100, offset = 0 } = req.query;

    let queryText = `
      SELECT c.*, u.name as issued_by_name, u.role as issued_by_role
      FROM certificates c
      LEFT JOIN users u ON c.issued_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      queryText += ` AND (c.student_name ILIKE $${params.length} OR c.certificate_number ILIKE $${params.length} OR c.program_name ILIKE $${params.length} OR c.student_email ILIKE $${params.length})`;
    }

    if (type.trim()) {
      params.push(type.trim());
      queryText += ` AND c.certificate_type = $${params.length}`;
    }

    if (status.trim()) {
      params.push(status.trim());
      queryText += ` AND c.status = $${params.length}`;
    }

    queryText += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await db.query(queryText, params);

    // Get total count matching search
    let countQuery = `SELECT COUNT(*) FROM certificates c WHERE 1=1`;
    const countParams = [];
    if (search.trim()) {
      countParams.push(`%${search.trim()}%`);
      countQuery += ` AND (c.student_name ILIKE $${countParams.length} OR c.certificate_number ILIKE $${countParams.length} OR c.program_name ILIKE $${countParams.length} OR c.student_email ILIKE $${countParams.length})`;
    }
    if (type.trim()) {
      countParams.push(type.trim());
      countQuery += ` AND c.certificate_type = $${countParams.length}`;
    }
    if (status.trim()) {
      countParams.push(status.trim());
      countQuery += ` AND c.status = $${countParams.length}`;
    }
    const totalCount = await db.query(countQuery, countParams);

    res.json({
      certificates: result.rows,
      total: parseInt(totalCount.rows[0].count, 10)
    });
  } catch (err) {
    console.error('List certificates error:', err);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// GET /api/certificates/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT c.*, u.name as issued_by_name, u.role as issued_by_role
       FROM certificates c
       LEFT JOIN users u ON c.issued_by = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Get download logs for this certificate
    const logs = await db.query(
      'SELECT id, ip_address, user_agent, downloaded_at FROM download_logs WHERE certificate_id = $1 ORDER BY downloaded_at DESC',
      [id]
    );

    res.json({
      certificate: result.rows[0],
      downloadLogs: logs.rows
    });
  } catch (err) {
    console.error('Get certificate error:', err);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// POST /api/certificates (Generate new certificate)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      student_name,
      student_email = '',
      program_name,
      certificate_type,
      issue_date,
      completion_date,
      notes = ''
    } = req.body;

    if (!student_name || !program_name || !certificate_type || !issue_date || !completion_date) {
      return res.status(400).json({
        error: 'Missing required fields: student_name, program_name, certificate_type, issue_date, completion_date'
      });
    }

    // Validate certificate type
    const validTypes = ['1 Week Internship', '2 Weeks Internship', '1 Month Internship', '6 Months Internship'];
    if (!validTypes.includes(certificate_type)) {
      return res.status(400).json({
        error: `Invalid certificate_type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const certNumber = await generateUniqueCertNumber();
    const verificationToken = crypto.randomBytes(32).toString('hex'); // 64 hex characters (fits VARCHAR(128))

    const insertResult = await db.query(
      `INSERT INTO certificates (
        certificate_number,
        verification_token,
        student_name,
        student_email,
        program_name,
        certificate_type,
        issue_date,
        completion_date,
        status,
        issued_by,
        download_count,
        max_downloads,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'valid', $9, 0, 2, $10)
      RETURNING *`,
      [
        certNumber,
        verificationToken,
        student_name.trim(),
        student_email.trim(),
        program_name.trim(),
        certificate_type,
        issue_date,
        completion_date,
        req.user.id,
        notes
      ]
    );

    res.status(201).json({
      message: 'Certificate generated successfully',
      certificate: insertResult.rows[0]
    });
  } catch (err) {
    console.error('Generate certificate error:', err);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// PUT /api/certificates/:id (Update certificate details)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { student_name, student_email, program_name, certificate_type, issue_date, completion_date, status, notes } = req.body;

    const current = await db.query('SELECT id FROM certificates WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const updated = await db.query(
      `UPDATE certificates 
       SET student_name = COALESCE($1, student_name),
           student_email = COALESCE($2, student_email),
           program_name = COALESCE($3, program_name),
           certificate_type = COALESCE($4, certificate_type),
           issue_date = COALESCE($5, issue_date),
           completion_date = COALESCE($6, completion_date),
           status = COALESCE($7, status),
           notes = COALESCE($8, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [student_name, student_email, program_name, certificate_type, issue_date, completion_date, status, notes, id]
    );

    res.json({ message: 'Certificate updated successfully', certificate: updated.rows[0] });
  } catch (err) {
    console.error('Update certificate error:', err);
    res.status(500).json({ error: 'Failed to update certificate' });
  }
});

// POST /api/certificates/:id/reset-downloads (Admin or SuperAdmin reset)
router.post('/:id/reset-downloads', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reset_to_zero = true, extra_downloads = 2 } = req.body;

    const certQuery = await db.query('SELECT * FROM certificates WHERE id = $1', [id]);
    if (certQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    let updated;
    if (reset_to_zero) {
      // Reset count to 0 so student gets 2 fresh downloads
      updated = await db.query(
        `UPDATE certificates 
         SET download_count = 0, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 RETURNING *`,
        [id]
      );
    } else {
      // Increment max_downloads
      updated = await db.query(
        `UPDATE certificates 
         SET max_downloads = max_downloads + $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 RETURNING *`,
        [extra_downloads, id]
      );
    }

    // Also mark any pending reset request for this certificate as approved
    await db.query(
      `UPDATE download_reset_requests 
       SET status = 'approved', resolved_by = $1, resolved_at = CURRENT_TIMESTAMP 
       WHERE certificate_id = $2 AND status = 'pending'`,
      [req.user.id, id]
    );

    res.json({
      message: 'Download limit reset successfully. The student can now download their certificate.',
      certificate: updated.rows[0]
    });
  } catch (err) {
    console.error('Reset download count error:', err);
    res.status(500).json({ error: 'Failed to reset download count' });
  }
});

// GET /api/certificates/:id/admin-pdf (Download directly without consuming student limit)
router.get('/:id/admin-pdf', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const certQuery = await db.query('SELECT * FROM certificates WHERE id = $1', [id]);
    if (certQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const cert = certQuery.rows[0];
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
    const verifyUrl = `${clientUrl}/verify/${cert.verification_token}`;

    const pdfBuffer = await generateCertificatePdf(cert, verifyUrl);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Raventiq-Certificate-${cert.certificate_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Admin PDF error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// DELETE /api/certificates/:id (SuperAdmin only)
router.delete('/:id', authenticate, requireRole(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM certificates WHERE id = $1', [id]);
    res.json({ message: 'Certificate permanently deleted' });
  } catch (err) {
    console.error('Delete certificate error:', err);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

module.exports = router;

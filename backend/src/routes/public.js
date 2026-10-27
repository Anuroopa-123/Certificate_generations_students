const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateCertificatePdf } = require('../services/pdfGenerator');
const { authenticate } = require('../middleware/auth');

// GET /api/public/verify/:identifier
// Identifier can be either certificate_number or verification_token
router.get('/verify/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ error: 'Certificate identifier is required' });
    }

    const cleanIdentifier = identifier.trim();

    // Query by token or by certificate number
    const result = await db.query(
      `SELECT c.id, c.certificate_number, c.verification_token, c.student_name, 
              c.program_name, c.certificate_type, c.issue_date, c.completion_date, 
              c.status, c.download_count, c.max_downloads, c.created_at,
              u.name as issued_by_name, u.designation as issued_by_designation
       FROM certificates c
       LEFT JOIN users u ON c.issued_by = u.id
       WHERE c.verification_token = $1 OR c.certificate_number = $1`,
      [cleanIdentifier]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        verified: false,
        error: 'CERTIFICATE_NOT_FOUND',
        message: 'No certificate found matching the provided identifier or QR token.'
      });
    }

    const cert = result.rows[0];
    const isLimitReached = cert.download_count >= cert.max_downloads;
    const remainingDownloads = Math.max(0, cert.max_downloads - cert.download_count);

    // Signatories information
    const signatories = [
      {
        name: 'Anu',
        role: 'Co-Founder & Chief Technology Officer (CTO)',
        organization: 'Raventiq Technologies',
        status: 'Authorized & Digitally Verified'
      },
      {
        name: 'Dinesh',
        role: 'Co-Founder & Chief Business Officer (CBO)',
        organization: 'Raventiq Technologies',
        status: 'Authorized & Digitally Verified'
      }
    ];

    res.json({
      verified: cert.status === 'valid',
      certificate: cert,
      signatories,
      download_status: {
        current_count: cert.download_count,
        max_allowed: cert.max_downloads,
        remaining_downloads: remainingDownloads,
        is_limit_reached: isLimitReached
      },
      issuer: {
        organization: 'Raventiq Technologies',
        tagline: 'Excellence in Engineering & Digital Innovation',
        verification_seal: 'OFFICIAL_CRYPTOGRAPHIC_SEAL_AUTHENTICATED'
      }
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Internal server error during certificate verification' });
  }
});

// GET /api/public/download/:token
// Anyone can download, but ONLY TWICE.
// Once download_count >= 2, block and instruct student to contact Superadmin or Admin.
router.get('/download/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const certQuery = await db.query(
      `SELECT * FROM certificates WHERE verification_token = $1`,
      [token.trim()]
    );

    if (certQuery.rows.length === 0) {
      return res.status(404).json({
        error: 'CERTIFICATE_NOT_FOUND',
        message: 'Certificate not found with this token'
      });
    }

    const cert = certQuery.rows[0];

    // Check certificate status
    if (cert.status !== 'valid') {
      return res.status(403).json({
        error: 'CERTIFICATE_INVALID',
        message: `This certificate is currently marked as ${cert.status}. Please contact Raventiq Technologies.`
      });
    }

    // CHECK DOWNLOAD LIMIT (MAX 2 DOWNLOADS ALLOWED)
    if (cert.download_count >= cert.max_downloads) {
      return res.status(403).json({
        error: 'DOWNLOAD_LIMIT_REACHED',
        message: `Download limit reached (${cert.download_count}/${cert.max_downloads} downloads used). You can download this certificate only twice. Please contact Raventiq Technologies SuperAdmin (Anu - CTO) or Admin (Dinesh - CBO) to reset your download access.`,
        certificate_id: cert.id,
        certificate_number: cert.certificate_number,
        student_name: cert.student_name,
        can_request_reset: true,
        contact_info: {
          superadmin: { name: 'Anu', role: 'Co-Founder & CTO', email: 'anu@raventiq.com' },
          admin: { name: 'Dinesh', role: 'Co-Founder & CBO', email: 'dinesh@raventiq.com' }
        }
      });
    }

    // Atomic increment of download_count
    const updateResult = await db.query(
      `UPDATE certificates 
       SET download_count = download_count + 1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND download_count < max_downloads 
       RETURNING download_count, max_downloads`,
      [cert.id]
    );

    if (updateResult.rows.length === 0) {
      // Race condition handled: reached limit concurrently
      return res.status(403).json({
        error: 'DOWNLOAD_LIMIT_REACHED',
        message: 'Download limit has just been reached. Please contact Admin or SuperAdmin.'
      });
    }

    const newCount = updateResult.rows[0].download_count;

    // Log the download event
    await db.query(
      `INSERT INTO download_logs (certificate_id, ip_address, user_agent) VALUES ($1, $2, $3)`,
      [cert.id, clientIp.toString().substring(0, 100), userAgent]
    );

    // Generate PDF
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
    const verifyUrl = `${clientUrl}/verify/${cert.verification_token}`;
    const pdfBuffer = await generateCertificatePdf(cert, verifyUrl);

    // Safe filename
    const safeStudentName = cert.student_name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Raventiq-Certificate-${safeStudentName}-${cert.certificate_number}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Downloads-Used', newCount);
    res.setHeader('X-Downloads-Remaining', cert.max_downloads - newCount);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Public download error:', err);
    res.status(500).json({ error: 'Failed to generate and download certificate' });
  }
});

// POST /api/public/request-reset
// Student submits request to SuperAdmin (Anu) and Admin (Dinesh) to reset their download count
router.post('/request-reset', async (req, res) => {
  try {
    const { certificate_number, student_name, student_email, reason } = req.body;
    if (!certificate_number || !reason) {
      return res.status(400).json({ error: 'Certificate number and reason are required' });
    }

    const certQuery = await db.query(
      'SELECT id, student_name, student_email, download_count, max_downloads FROM certificates WHERE certificate_number = $1',
      [certificate_number.trim()]
    );

    if (certQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const cert = certQuery.rows[0];

    // Check if there is already a pending request
    const pendingCheck = await db.query(
      "SELECT id FROM download_reset_requests WHERE certificate_id = $1 AND status = 'pending'",
      [cert.id]
    );

    if (pendingCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'A reset request for this certificate is already pending review by SuperAdmin Anu or Admin Dinesh.'
      });
    }

    const newRequest = await db.query(
      `INSERT INTO download_reset_requests 
       (certificate_id, student_name, student_email, certificate_number, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [
        cert.id,
        student_name || cert.student_name,
        student_email || cert.student_email,
        certificate_number.trim(),
        reason.trim()
      ]
    );

    res.status(201).json({
      message: 'Your download reset request has been submitted to SuperAdmin Anu and Admin Dinesh. Once approved, your download count will be refreshed.',
      request: newRequest.rows[0]
    });
  } catch (err) {
    console.error('Request reset error:', err);
    res.status(500).json({ error: 'Failed to submit reset request' });
  }
});

// GET /api/public/requests (Admin & SuperAdmin view pending/all reset requests)
router.get('/requests', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, c.program_name, c.certificate_type, c.download_count, c.max_downloads,
              u.name as resolved_by_name
       FROM download_reset_requests r
       JOIN certificates c ON r.certificate_id = c.id
       LEFT JOIN users u ON r.resolved_by = u.id
       ORDER BY CASE WHEN r.status = 'pending' THEN 1 ELSE 2 END, r.created_at DESC`
    );
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ error: 'Failed to fetch reset requests' });
  }
});

// POST /api/public/requests/:id/approve (Admin or SuperAdmin approves request)
router.post('/requests/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const reqQuery = await db.query('SELECT * FROM download_reset_requests WHERE id = $1', [id]);
    if (reqQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const resetReq = reqQuery.rows[0];

    // Reset certificate download_count to 0
    await db.query(
      'UPDATE certificates SET download_count = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [resetReq.certificate_id]
    );

    // Update request status to approved
    const updated = await db.query(
      `UPDATE download_reset_requests 
       SET status = 'approved', resolved_by = $1, resolved_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [req.user.id, id]
    );

    res.json({
      message: 'Download reset approved! The student now has 2 new downloads available.',
      request: updated.rows[0]
    });
  } catch (err) {
    console.error('Approve reset request error:', err);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// POST /api/public/requests/:id/reject (Admin or SuperAdmin rejects request)
router.post('/requests/:id/reject', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await db.query(
      `UPDATE download_reset_requests 
       SET status = 'rejected', resolved_by = $1, resolved_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [req.user.id, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ message: 'Request rejected', request: updated.rows[0] });
  } catch (err) {
    console.error('Reject request error:', err);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

module.exports = router;

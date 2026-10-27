const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate, requireRole, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userQuery = await db.query(
      'SELECT id, name, email, password_hash, role, designation, phone, signature_title FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        designation: user.designation
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        phone: user.phone,
        signature_title: user.signature_title
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const userQuery = await db.query(
      'SELECT id, name, email, role, designation, phone, signature_title, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: userQuery.rows[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const userQuery = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const isMatch = await bcrypt.compare(current_password, userQuery.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// GET /api/auth/team (SuperAdmin & Admin can view co-founders and admins)
router.get('/team', authenticate, async (req, res) => {
  try {
    const team = await db.query(
      'SELECT id, name, email, role, designation, phone, signature_title, created_at FROM users ORDER BY role DESC, id ASC'
    );
    res.json({ team: team.rows });
  } catch (err) {
    console.error('Get team error:', err);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// POST /api/auth/create-admin (SuperAdmin Anu only)
router.post('/create-admin', authenticate, requireRole(['superadmin']), async (req, res) => {
  try {
    const { name, email, password, role = 'admin', designation, phone, signature_title } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const check = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, designation, phone, signature_title)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, designation, phone, signature_title, created_at`,
      [name.trim(), email.trim(), passwordHash, role, designation || 'Operations Admin', phone || '', signature_title || 'Administrator']
    );

    res.status(201).json({ message: 'Admin account created successfully', admin: result.rows[0] });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

module.exports = router;

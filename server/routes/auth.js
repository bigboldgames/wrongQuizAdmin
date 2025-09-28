const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Login route
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;
    const db = getDatabase();

    // Find user by username or email
    db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        db.run(
          'UPDATE users SET last_login = datetime("now") WHERE id = ?',
          [user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            email: user.email, 
            role: user.role 
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Store session
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        db.run(
          'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
          [user.id, token, expiresAt.toISOString()]
        );

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            lastLogin: user.last_login
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout route
router.post('/logout', authenticateToken, (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const db = getDatabase();
    // Remove session (blacklist token)
    db.run(
      'DELETE FROM sessions WHERE token = ?',
      [token],
      (err) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        res.json({ message: 'Logout successful' });
      }
    );
  } else {
    res.status(400).json({ message: 'No token provided' });
  }
});

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Refresh token route
router.post('/refresh', authenticateToken, (req, res) => {
  const authHeader = req.headers['authorization'];
  const oldToken = authHeader && authHeader.split(' ')[1];

  if (oldToken) {
    // Generate new token
    const newToken = jwt.sign(
      { 
        id: req.user.id, 
        username: req.user.username, 
        email: req.user.email, 
        role: req.user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const db = getDatabase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Remove old session and create new one
    db.serialize(() => {
      db.run('DELETE FROM sessions WHERE token = ?', [oldToken]);
      db.run(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
        [req.user.id, newToken, expiresAt.toISOString()]
      );
    });

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });
  } else {
    res.status(400).json({ message: 'No token provided' });
  }
});

module.exports = router;



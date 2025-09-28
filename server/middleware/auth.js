const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Check if token is blacklisted
    const db = getDatabase();
    db.get(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")',
      [token],
      (err, session) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        if (!session) {
          return res.status(403).json({ message: 'Token has been revoked' });
        }

        req.user = user;
        next();
      }
    );
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin
};



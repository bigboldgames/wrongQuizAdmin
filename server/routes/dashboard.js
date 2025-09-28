const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all dashboard routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get dashboard statistics
router.get('/stats', (req, res) => {
  const db = getDatabase();
  
  db.get('SELECT * FROM dashboard_stats WHERE id = 1', (err, stats) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (!stats) {
      return res.status(404).json({ message: 'Dashboard stats not found' });
    }

    res.json({
      totalUsers: stats.total_users,
      totalOrders: stats.total_orders,
      totalRevenue: stats.total_revenue,
      lastUpdated: stats.last_updated
    });
  });
});

// Update dashboard statistics
router.put('/stats', (req, res) => {
  const { totalUsers, totalOrders, totalRevenue } = req.body;
  const db = getDatabase();

  if (totalUsers === undefined || totalOrders === undefined || totalRevenue === undefined) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  db.run(
    'UPDATE dashboard_stats SET total_users = ?, total_orders = ?, total_revenue = ?, last_updated = datetime("now") WHERE id = 1',
    [totalUsers, totalOrders, totalRevenue],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({ 
        message: 'Stats updated successfully',
        changes: this.changes
      });
    }
  );
});

// Get recent activity (mock data for demo)
router.get('/activity', (req, res) => {
  const mockActivity = [
    {
      id: 1,
      type: 'user_registration',
      message: 'New user registered: john.doe@example.com',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      severity: 'info'
    },
    {
      id: 2,
      type: 'order_created',
      message: 'New order #12345 created',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      severity: 'success'
    },
    {
      id: 3,
      type: 'payment_received',
      message: 'Payment of $99.99 received for order #12344',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      severity: 'success'
    },
    {
      id: 4,
      type: 'system_warning',
      message: 'High server load detected',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      severity: 'warning'
    },
    {
      id: 5,
      type: 'user_login',
      message: 'Admin user logged in from 192.168.1.100',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      severity: 'info'
    }
  ];

  res.json(mockActivity);
});

// Get user list
router.get('/users', (req, res) => {
  const db = getDatabase();
  
  db.all(
    'SELECT id, username, email, role, created_at, last_login FROM users ORDER BY created_at DESC',
    (err, users) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      res.json(users);
    }
  );
});

// Create new user
router.post('/users', (req, res) => {
  const { username, email, password, role = 'user' } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync(password, 10);
  const db = getDatabase();

  db.run(
    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, role],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ message: 'Username or email already exists' });
        }
        return res.status(500).json({ message: 'Database error' });
      }

      res.status(201).json({
        message: 'User created successfully',
        userId: this.lastID
      });
    }
  );
});

// Delete user
router.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  const db = getDatabase();

  // Prevent deleting the current user
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  });
});

module.exports = router;



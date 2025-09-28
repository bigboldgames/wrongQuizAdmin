const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all language routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all languages
router.get('/', (req, res) => {
  const db = getDatabase();
  
  db.all('SELECT * FROM languages ORDER BY is_default DESC, name ASC', (err, languages) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(languages);
  });
});

// Get active languages
router.get('/active', (req, res) => {
  const db = getDatabase();
  
  db.all('SELECT * FROM languages WHERE is_active = 1 ORDER BY is_default DESC, name ASC', (err, languages) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(languages);
  });
});

// Create new language
router.post('/', [
  body('code').isLength({ min: 2, max: 5 }).withMessage('Language code must be 2-5 characters'),
  body('name').notEmpty().withMessage('Language name is required'),
  body('native_name').notEmpty().withMessage('Native name is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { code, name, native_name, is_active = true, is_default = false } = req.body;
  const db = getDatabase();

  // If setting as default, unset other defaults
  if (is_default) {
    db.run('UPDATE languages SET is_default = 0');
  }

  db.run(
    'INSERT INTO languages (code, name, native_name, is_active, is_default) VALUES (?, ?, ?, ?, ?)',
    [code, name, native_name, is_active, is_default],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ message: 'Language code already exists' });
        }
        return res.status(500).json({ message: 'Database error' });
      }

      res.status(201).json({
        message: 'Language created successfully',
        languageId: this.lastID
      });
    }
  );
});

// Update language
router.put('/:id', [
  body('code').optional().isLength({ min: 2, max: 5 }).withMessage('Language code must be 2-5 characters'),
  body('name').optional().notEmpty().withMessage('Language name is required'),
  body('native_name').optional().notEmpty().withMessage('Native name is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const languageId = req.params.id;
  const { code, name, native_name, is_active, is_default } = req.body;
  const db = getDatabase();

  // If setting as default, unset other defaults
  if (is_default) {
    db.run('UPDATE languages SET is_default = 0');
  }

  const updates = [];
  const values = [];

  if (code !== undefined) {
    updates.push('code = ?');
    values.push(code);
  }
  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (native_name !== undefined) {
    updates.push('native_name = ?');
    values.push(native_name);
  }
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(is_active);
  }
  if (is_default !== undefined) {
    updates.push('is_default = ?');
    values.push(is_default);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  values.push(languageId);

  db.run(
    `UPDATE languages SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ message: 'Language code already exists' });
        }
        return res.status(500).json({ message: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Language not found' });
      }

      res.json({ message: 'Language updated successfully' });
    }
  );
});

// Delete language
router.delete('/:id', (req, res) => {
  const languageId = req.params.id;
  const db = getDatabase();

  // Check if it's the default language
  db.get('SELECT is_default FROM languages WHERE id = ?', [languageId], (err, language) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (!language) {
      return res.status(404).json({ message: 'Language not found' });
    }

    if (language.is_default) {
      return res.status(400).json({ message: 'Cannot delete default language' });
    }

    // Delete associated content
    db.run('DELETE FROM content WHERE language_code = (SELECT code FROM languages WHERE id = ?)', [languageId], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      // Delete language
      db.run('DELETE FROM languages WHERE id = ?', [languageId], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: 'Language not found' });
        }

        res.json({ message: 'Language deleted successfully' });
      });
    });
  });
});

module.exports = router;



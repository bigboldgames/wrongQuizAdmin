const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all content routes except public ones
// router.use(authenticateToken);
// router.use(requireAdmin);

// Get all pages
router.get('/pages', (req, res) => {
  const db = getDatabase();
  
  db.all('SELECT * FROM pages ORDER BY title ASC', (err, pages) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(pages);
  });
});

// Get all content for a specific language by language code
router.get('/language-code/:languageCode', (req, res) => {
  const { languageCode } = req.params;
  const db = getDatabase();
  
  // Get all content for this language code
  db.all(`
    SELECT 
      c.*,
      p.title as page_title,
      l.name as language_name
    FROM content c
    LEFT JOIN pages p ON c.page = p.slug
    LEFT JOIN languages l ON c.language_code = l.code
    WHERE c.language_code = ?
    ORDER BY c.page, c.section, c.key
  `, [languageCode], (err, content) => {
    if (err) {
      console.error('Content query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    // Group content by page and section for easier access
    const groupedContent = {};
    
    content.forEach(item => {
      if (!groupedContent[item.page]) {
        groupedContent[item.page] = {
          page_title: item.page_title,
          sections: {}
        };
      }
      
      if (!groupedContent[item.page].sections[item.section]) {
        groupedContent[item.page].sections[item.section] = {};
      }
      
      groupedContent[item.page].sections[item.section][item.key] = {
        id: item.id,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at
      };
    });
    
    res.json({
      success: true,
      language_code: languageCode,
      language_name: content.length > 0 ? content[0].language_name : null,
      data: groupedContent,
      total_items: content.length
    });
  });
});

// Get simplified content for a specific language - Page: {attribute: {content: "value"}}
router.get('/simple/:languageCode', (req, res) => {
  const { languageCode } = req.params;
  const db = getDatabase();
  
  // Get all content for this language code
  db.all(`
    SELECT 
      c.*,
      p.title as page_title,
      l.name as language_name
    FROM content c
    LEFT JOIN pages p ON c.page = p.slug
    LEFT JOIN languages l ON c.language_code = l.code
    WHERE c.language_code = ?
    ORDER BY c.page, c.section, c.key
  `, [languageCode], (err, content) => {
    if (err) {
      console.error('Content query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    // Create simplified structure: Page: {attribute: {content: "value"}}
    const simpleContent = {};
    
    content.forEach(item => {
      if (!simpleContent[item.page]) {
        simpleContent[item.page] = {};
      }
      
      // Create attribute name from section and key
      const attributeName = item.section && item.key ? `${item.section}_${item.key}` : (item.key || item.section);
      
      simpleContent[item.page][attributeName] = {
        content: item.content
      };
    });
    
    res.json({
      success: true,
      language_code: languageCode,
      language_name: content.length > 0 ? content[0].language_name : null,
      data: simpleContent,
      total_items: content.length
    });
  });
});

// Get all content for a specific language by language name
router.get('/language/:languageName', (req, res) => {
  const { languageName } = req.params;
  const db = getDatabase();
  
  // First get the language code from language name
  db.get(
    'SELECT code FROM languages WHERE name = ? AND is_active = 1',
    [languageName],
    (err, language) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (!language) {
        return res.status(404).json({ message: 'Language not found' });
      }
      
      console.log('Found language:', language);
      
      // Get all content for this language
      db.all(`
        SELECT 
          c.*,
          p.title as page_title,
          l.name as language_name
        FROM content c
        LEFT JOIN pages p ON c.page = p.slug
        LEFT JOIN languages l ON c.language_code = l.code
        WHERE c.language_code = ?
        ORDER BY c.page, c.section, c.key
      `, [language.code], (err, content) => {
        if (err) {
          console.error('Content query error:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        
        console.log('Found content items:', content.length);
        
        // Group content by page and section for easier access
        const groupedContent = {};
        
        content.forEach(item => {
          if (!groupedContent[item.page]) {
            groupedContent[item.page] = {
              page_title: item.page_title,
              sections: {}
            };
          }
          
          if (!groupedContent[item.page].sections[item.section]) {
            groupedContent[item.page].sections[item.section] = {};
          }
          
          groupedContent[item.page].sections[item.section][item.key] = {
            id: item.id,
            content: item.content,
            created_at: item.created_at,
            updated_at: item.updated_at
          };
        });
        
        res.json({
          success: true,
          language_name: languageName,
          language_code: language.code,
          data: groupedContent,
          total_items: content.length
        });
      });
    }
  );
});

// Get all content for all pages in one call
router.get('/all', (req, res) => {
  const db = getDatabase();
  
  db.all(`
    SELECT 
      c.*,
      p.title as page_title,
      l.name as language_name
    FROM content c
    LEFT JOIN pages p ON c.page = p.slug
    LEFT JOIN languages l ON c.language_code = l.code
    ORDER BY c.page, c.language_code, c.section, c.key
  `, (err, content) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    // Group content by page and language for easier access
    const groupedContent = {};
    
    content.forEach(item => {
      if (!groupedContent[item.page]) {
        groupedContent[item.page] = {
          page_title: item.page_title,
          languages: {}
        };
      }
      
      if (!groupedContent[item.page].languages[item.language_code]) {
        groupedContent[item.page].languages[item.language_code] = {
          language_name: item.language_name,
          sections: {}
        };
      }
      
      if (!groupedContent[item.page].languages[item.language_code].sections[item.section]) {
        groupedContent[item.page].languages[item.language_code].sections[item.section] = {};
      }
      
      groupedContent[item.page].languages[item.language_code].sections[item.section][item.key] = {
        id: item.id,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at
      };
    });
    
    res.json({
      success: true,
      data: groupedContent,
      total_items: content.length
    });
  });
});

// Get simplified content structure - Page: {attribute: {content: "value"}}
router.get('/simple', (req, res) => {
  const db = getDatabase();
  
  db.all(`
    SELECT 
      c.*,
      p.title as page_title,
      l.name as language_name
    FROM content c
    LEFT JOIN pages p ON c.page = p.slug
    LEFT JOIN languages l ON c.language_code = l.code
    ORDER BY c.page, c.language_code, c.section, c.key
  `, (err, content) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    // Create simplified structure: Page: {attribute: {content: "value"}}
    const simpleContent = {};
    
    content.forEach(item => {
      if (!simpleContent[item.page]) {
        simpleContent[item.page] = {};
      }
      
      // Create attribute name from section and key
      const attributeName = item.section && item.key ? `${item.section}_${item.key}` : (item.key || item.section);
      
      simpleContent[item.page][attributeName] = {
        content: item.content,
        language: item.language_code,
        language_name: item.language_name
      };
    });
    
    res.json({
      success: true,
      data: simpleContent,
      total_items: content.length
    });
  });
});

// Get content for a specific page and language
router.get('/:page/:language', (req, res) => {
  const { page, language } = req.params;
  const db = getDatabase();
  
  db.all(
    'SELECT * FROM content WHERE page = ? AND language_code = ? ORDER BY section, key',
    [page, language],
    (err, content) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      res.json(content);
    }
  );
});

// Get all content for a page across all languages
router.get('/:page', (req, res) => {
  const { page } = req.params;
  const db = getDatabase();
  
  db.all(
    'SELECT * FROM content WHERE page = ? ORDER BY language_code, section, key',
    [page],
    (err, content) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      res.json(content);
    }
  );
});

// Create or update content (requires authentication)
router.post('/', authenticateToken, requireAdmin, [
  body('page').notEmpty().withMessage('Page is required'),
  body('section').notEmpty().withMessage('Section is required'),
  body('key').notEmpty().withMessage('Key is required'),
  body('language_code').isLength({ min: 2, max: 5 }).withMessage('Language code must be 2-5 characters'),
  body('content').notEmpty().withMessage('Content is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { page, section, key, language_code, content } = req.body;
  const db = getDatabase();

  // Check if language exists
  db.get('SELECT id FROM languages WHERE code = ? AND is_active = 1', [language_code], (err, language) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (!language) {
      return res.status(400).json({ message: 'Language not found or inactive' });
    }

    // Insert or update content
    db.run(
      `INSERT INTO content (page, section, key, language_code, content, updated_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(page, section, key, language_code) 
       DO UPDATE SET content = excluded.content, updated_at = datetime('now')`,
      [page, section, key, language_code, content],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        res.status(201).json({
          message: 'Content saved successfully',
          contentId: this.lastID
        });
      }
    );
  });
});

// Update content (requires authentication)
router.put('/:id', authenticateToken, requireAdmin, [
  body('content').notEmpty().withMessage('Content is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const contentId = req.params.id;
  const { content } = req.body;
  const db = getDatabase();

  db.run(
    'UPDATE content SET content = ?, updated_at = datetime("now") WHERE id = ?',
    [content, contentId],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Content not found' });
      }

      res.json({ message: 'Content updated successfully' });
    }
  );
});

// Delete content (requires authentication)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const contentId = req.params.id;
  const db = getDatabase();

  db.run('DELETE FROM content WHERE id = ?', [contentId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.json({ message: 'Content deleted successfully' });
  });
});

// Bulk update content for multiple languages (requires authentication)
router.post('/bulk', authenticateToken, requireAdmin, [
  body('page').notEmpty().withMessage('Page is required'),
  body('section').notEmpty().withMessage('Section is required'),
  body('key').notEmpty().withMessage('Key is required'),
  body('translations').isArray().withMessage('Translations must be an array')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { page, section, key, translations } = req.body;
  const db = getDatabase();

  // Validate all language codes exist
  const languageCodes = translations.map(t => t.language_code);
  const placeholders = languageCodes.map(() => '?').join(',');

  db.all(
    `SELECT code FROM languages WHERE code IN (${placeholders}) AND is_active = 1`,
    languageCodes,
    (err, validLanguages) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      const validCodes = validLanguages.map(l => l.code);
      const invalidCodes = languageCodes.filter(code => !validCodes.includes(code));

      if (invalidCodes.length > 0) {
        return res.status(400).json({ 
          message: `Invalid or inactive language codes: ${invalidCodes.join(', ')}` 
        });
      }

      // Insert/update all translations
      const stmt = db.prepare(
        `INSERT INTO content (page, section, key, language_code, content, updated_at) 
         VALUES (?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(page, section, key, language_code) 
         DO UPDATE SET content = excluded.content, updated_at = datetime('now')`
      );

      let completed = 0;
      let hasError = false;

      translations.forEach(translation => {
        stmt.run([page, section, key, translation.language_code, translation.content], (err) => {
          if (err && !hasError) {
            hasError = true;
            return res.status(500).json({ message: 'Database error' });
          }

          completed++;
          if (completed === translations.length && !hasError) {
            stmt.finalize();
            res.status(201).json({
              message: 'Bulk content update successful',
              updatedCount: translations.length
            });
          }
        });
      });
    }
  );
});

// Get content structure (all sections and keys for a page)
router.get('/structure/:page', (req, res) => {
  const { page } = req.params;
  const db = getDatabase();
  
  db.all(
    `SELECT DISTINCT section, key 
     FROM content 
     WHERE page = ? 
     ORDER BY section, key`,
    [page],
    (err, structure) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      res.json(structure);
    }
  );
});


module.exports = router;

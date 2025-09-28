const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all question routes
router.use(authenticateToken);
router.use(requireAdmin);

// Create new question
router.post('/', [
  body('quiz_id').isInt().withMessage('Quiz ID must be a number'),
  body('question_type').isIn(['text', 'media']).withMessage('Question type must be text or media'),
  body('order_index').optional().isInt().withMessage('Order index must be a number'),
  body('content').isArray().withMessage('Content must be an array'),
  body('content.*.language_code').notEmpty().withMessage('Language code is required'),
  body('content.*.question_text').notEmpty().withMessage('Question text is required'),
  body('options').isArray().withMessage('Options must be an array'),
  body('options.*.order_index').isInt().withMessage('Option order index must be a number'),
  body('options.*.is_correct').isBoolean().withMessage('is_correct must be boolean'),
  body('options.*.content').isArray().withMessage('Option content must be an array')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { quiz_id, question_type, order_index = 0, content, options } = req.body;
  const db = getDatabase();

  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Insert question
    db.run(
      'INSERT INTO questions (quiz_id, question_type, order_index) VALUES (?, ?, ?)',
      [quiz_id, question_type, order_index],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Database error' });
        }

        const questionId = this.lastID;

        // Insert question content
        const contentStmt = db.prepare(`
          INSERT INTO question_content (question_id, language_code, question_text, media_url, explanation) 
          VALUES (?, ?, ?, ?, ?)
        `);

        let contentCompleted = 0;
        let hasContentError = false;

        content.forEach(contentItem => {
          contentStmt.run([
            questionId,
            contentItem.language_code,
            contentItem.question_text,
            contentItem.media_url || null,
            contentItem.explanation || null
          ], (err) => {
            if (err && !hasContentError) {
              hasContentError = true;
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Database error' });
            }

            contentCompleted++;
            if (contentCompleted === content.length && !hasContentError) {
              contentStmt.finalize();

              // Insert options
              const optionStmt = db.prepare(`
                INSERT INTO options (question_id, order_index, is_correct) 
                VALUES (?, ?, ?)
              `);

              let optionCompleted = 0;
              let hasOptionError = false;

              options.forEach(option => {
                optionStmt.run([questionId, option.order_index, option.is_correct], function(err) {
                  if (err && !hasOptionError) {
                    hasOptionError = true;
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Database error' });
                  }

                  const optionId = this.lastID;

                  // Insert option content
                  const optionContentStmt = db.prepare(`
                    INSERT INTO option_content (option_id, language_code, option_text, media_url) 
                    VALUES (?, ?, ?, ?)
                  `);

                  let optionContentCompleted = 0;
                  let hasOptionContentError = false;

                  option.content.forEach(optionContent => {
                    optionContentStmt.run([
                      optionId,
                      optionContent.language_code,
                      optionContent.option_text,
                      optionContent.media_url || null
                    ], (err) => {
                      if (err && !hasOptionContentError) {
                        hasOptionContentError = true;
                        db.run('ROLLBACK');
                        return res.status(500).json({ message: 'Database error' });
                      }

                      optionContentCompleted++;
                      if (optionContentCompleted === option.content.length && !hasOptionContentError) {
                        optionContentStmt.finalize();

                        optionCompleted++;
                        if (optionCompleted === options.length && !hasOptionError) {
                          optionStmt.finalize();
                          db.run('COMMIT');
                          res.status(201).json({
                            message: 'Question created successfully',
                            questionId: questionId
                          });
                        }
                      }
                    });
                  });
                });
              });
            }
          });
        });
      }
    );
  });
});

// Update question
router.put('/:id', [
  body('question_type').optional().isIn(['text', 'media']).withMessage('Question type must be text or media'),
  body('order_index').optional().isInt().withMessage('Order index must be a number'),
  body('content').optional().isArray().withMessage('Content must be an array'),
  body('options').optional().isArray().withMessage('Options must be an array')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const questionId = req.params.id;
  const { question_type, order_index, content, options } = req.body;
  const db = getDatabase();

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Update question basic info
    const updates = [];
    const values = [];

    if (question_type !== undefined) {
      updates.push('question_type = ?');
      values.push(question_type);
    }
    if (order_index !== undefined) {
      updates.push('order_index = ?');
      values.push(order_index);
    }

    if (updates.length > 0) {
      updates.push('updated_at = datetime("now")');
      values.push(questionId);

      db.run(
        `UPDATE questions SET ${updates.join(', ')} WHERE id = ?`,
        values,
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Database error' });
          }
        }
      );
    }

    // Update content if provided
    if (content) {
      // Delete existing content
      db.run('DELETE FROM question_content WHERE question_id = ?', [questionId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Database error' });
        }

        // Insert new content
        const contentStmt = db.prepare(`
          INSERT INTO question_content (question_id, language_code, question_text, media_url, explanation) 
          VALUES (?, ?, ?, ?, ?)
        `);

        let contentCompleted = 0;
        content.forEach(contentItem => {
          contentStmt.run([
            questionId,
            contentItem.language_code,
            contentItem.question_text,
            contentItem.media_url || null,
            contentItem.explanation || null
          ], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Database error' });
            }

            contentCompleted++;
            if (contentCompleted === content.length) {
              contentStmt.finalize();
            }
          });
        });
      });
    }

    // Update options if provided
    if (options) {
      // Delete existing options and their content
      db.run('DELETE FROM option_content WHERE option_id IN (SELECT id FROM options WHERE question_id = ?)', [questionId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Database error' });
        }

        db.run('DELETE FROM options WHERE question_id = ?', [questionId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Database error' });
          }

          // Insert new options
          const optionStmt = db.prepare(`
            INSERT INTO options (question_id, order_index, is_correct) 
            VALUES (?, ?, ?)
          `);

          let optionCompleted = 0;
          options.forEach(option => {
            optionStmt.run([questionId, option.order_index, option.is_correct], function(err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Database error' });
              }

              const optionId = this.lastID;

              // Insert option content
              const optionContentStmt = db.prepare(`
                INSERT INTO option_content (option_id, language_code, option_text, media_url) 
                VALUES (?, ?, ?, ?)
              `);

              let optionContentCompleted = 0;
              option.content.forEach(optionContent => {
                optionContentStmt.run([
                  optionId,
                  optionContent.language_code,
                  optionContent.option_text,
                  optionContent.media_url || null
                ], (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Database error' });
                  }

                  optionContentCompleted++;
                  if (optionContentCompleted === option.content.length) {
                    optionContentStmt.finalize();

                    optionCompleted++;
                    if (optionCompleted === options.length) {
                      optionStmt.finalize();
                      db.run('COMMIT');
                      res.json({ message: 'Question updated successfully' });
                    }
                  }
                });
              });
            });
          });
        });
      });
    } else {
      // No options to update, just commit
      db.run('COMMIT');
      res.json({ message: 'Question updated successfully' });
    }
  });
});

// Delete question
router.delete('/:id', (req, res) => {
  const questionId = req.params.id;
  const db = getDatabase();

  db.run('DELETE FROM questions WHERE id = ?', [questionId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  });
});

// Get question by ID
router.get('/:id', (req, res) => {
  const questionId = req.params.id;
  const db = getDatabase();

  // Get question details
  db.get(`
    SELECT q.*, qz.title as quiz_title 
    FROM questions q
    JOIN quizzes qz ON q.quiz_id = qz.id
    WHERE q.id = ?
  `, [questionId], (err, question) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Get question content
    db.all(`
      SELECT language_code, question_text, media_url, explanation
      FROM question_content
      WHERE question_id = ?
    `, [questionId], (err, content) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      // Get options
      db.all(`
        SELECT o.id, o.order_index, o.is_correct, o.is_active,
               oc.language_code, oc.option_text, oc.media_url
        FROM options o
        LEFT JOIN option_content oc ON o.id = oc.option_id
        WHERE o.question_id = ?
        ORDER BY o.order_index, oc.language_code
      `, [questionId], (err, options) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        // Organize options
        const optionsMap = {};
        options.forEach(opt => {
          if (!optionsMap[opt.id]) {
            optionsMap[opt.id] = {
              id: opt.id,
              order_index: opt.order_index,
              is_correct: opt.is_correct,
              is_active: opt.is_active,
              content: {}
            };
          }
          if (opt.language_code) {
            optionsMap[opt.id].content[opt.language_code] = {
              option_text: opt.option_text,
              media_url: opt.media_url
            };
          }
        });

        res.json({
          ...question,
          content: content.reduce((acc, item) => {
            acc[item.language_code] = {
              question_text: item.question_text,
              media_url: item.media_url,
              explanation: item.explanation
            };
            return acc;
          }, {}),
          options: Object.values(optionsMap).sort((a, b) => a.order_index - b.order_index)
        });
      });
    });
  });
});

module.exports = router;



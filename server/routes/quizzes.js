const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all quiz routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all quizzes
router.get('/', (req, res) => {
  const db = getDatabase();
  
  db.all(`
    SELECT q.*, u.username as created_by_name 
    FROM quizzes q 
    LEFT JOIN users u ON q.created_by = u.id 
    ORDER BY q.created_at DESC
  `, (err, quizzes) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(quizzes);
  });
});

// Get quiz by ID with questions and options
router.get('/:id', (req, res) => {
  const quizId = req.params.id;
  const db = getDatabase();
  
  // Get quiz details
  db.get(`
    SELECT q.*, u.username as created_by_name 
    FROM quizzes q 
    LEFT JOIN users u ON q.created_by = u.id 
    WHERE q.id = ?
  `, [quizId], (err, quiz) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Get questions with content and options
    db.all(`
      SELECT 
        q.id, q.question_type, q.order_index, q.is_active,
        qc.language_code, qc.question_text, qc.media_url, qc.explanation
      FROM questions q
      LEFT JOIN question_content qc ON q.id = qc.question_id
      WHERE q.quiz_id = ?
      ORDER BY q.order_index, qc.language_code
    `, [quizId], (err, questions) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      // Get options for each question
      const questionIds = [...new Set(questions.map(q => q.id))];
      if (questionIds.length === 0) {
        return res.json({ ...quiz, questions: [] });
      }

      const placeholders = questionIds.map(() => '?').join(',');
      db.all(`
        SELECT 
          o.id, o.question_id, o.order_index, o.is_correct, o.is_active,
          oc.language_code, oc.option_text, oc.media_url
        FROM options o
        LEFT JOIN option_content oc ON o.id = oc.option_id
        WHERE o.question_id IN (${placeholders})
        ORDER BY o.question_id, o.order_index, oc.language_code
      `, questionIds, (err, options) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        // Organize data
        const questionsMap = {};
        questions.forEach(q => {
          if (!questionsMap[q.id]) {
            questionsMap[q.id] = {
              id: q.id,
              question_type: q.question_type,
              order_index: q.order_index,
              is_active: q.is_active,
              content: {},
              options: []
            };
          }
          if (q.language_code) {
            questionsMap[q.id].content[q.language_code] = {
              question_text: q.question_text,
              media_url: q.media_url,
              explanation: q.explanation
            };
          }
        });

        options.forEach(opt => {
          const question = questionsMap[opt.question_id];
          if (question) {
            let option = question.options.find(o => o.id === opt.id);
            if (!option) {
              option = {
                id: opt.id,
                order_index: opt.order_index,
                is_correct: opt.is_correct,
                is_active: opt.is_active,
                content: {}
              };
              question.options.push(option);
            }
            if (opt.language_code) {
              option.content[opt.language_code] = {
                option_text: opt.option_text,
                media_url: opt.media_url
              };
            }
          }
        });

        const organizedQuestions = Object.values(questionsMap).sort((a, b) => a.order_index - b.order_index);
        res.json({ ...quiz, questions: organizedQuestions });
      });
    });
  });
});

// Create new quiz
router.post('/', [
  body('title').notEmpty().withMessage('Quiz title is required'),
  body('description').optional()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { title, description } = req.body;
  const db = getDatabase();

  db.run(
    'INSERT INTO quizzes (title, description, created_by) VALUES (?, ?, ?)',
    [title, description, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      res.status(201).json({
        message: 'Quiz created successfully',
        quizId: this.lastID
      });
    }
  );
});

// Update quiz
router.put('/:id', [
  body('title').optional().notEmpty().withMessage('Quiz title cannot be empty'),
  body('description').optional()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const quizId = req.params.id;
  const { title, description, is_active } = req.body;
  const db = getDatabase();

  const updates = [];
  const values = [];

  if (title !== undefined) {
    updates.push('title = ?');
    values.push(title);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(is_active);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  updates.push('updated_at = datetime("now")');
  values.push(quizId);

  db.run(
    `UPDATE quizzes SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      res.json({ message: 'Quiz updated successfully' });
    }
  );
});

// Delete quiz
router.delete('/:id', (req, res) => {
  const quizId = req.params.id;
  const db = getDatabase();

  db.run('DELETE FROM quizzes WHERE id = ?', [quizId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json({ message: 'Quiz deleted successfully' });
  });
});

module.exports = router;



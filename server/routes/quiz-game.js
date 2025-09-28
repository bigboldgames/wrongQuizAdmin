const express = require('express');
const db = require('../database/connection');
const router = express.Router();

// Generate unique quiz ID for user
router.post('/create-session', async (req, res) => {
  try {
    const { quiz_id, user_name, language_code } = req.body;

    if (!quiz_id || !user_name || !language_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quiz ID, user name, and language code are required' 
      });
    }

    // Check if quiz exists
    const quiz = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM quizzes WHERE id = ? AND is_active = 1', [quiz_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz not found' 
      });
    }

    // Generate unique ID
    const unique_id = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create session
    const sessionId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO user_quiz_sessions (quiz_id, unique_id, user_name, language_code) VALUES (?, ?, ?, ?)',
        [quiz_id, unique_id, user_name, language_code],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.json({
      success: true,
      data: {
        session_id: sessionId,
        unique_id: unique_id,
        quiz_title: quiz.title,
        user_name: user_name,
        language_code: language_code
      },
      message: 'Quiz session created successfully'
    });

  } catch (error) {
    console.error('Error creating quiz session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create quiz session' 
    });
  }
});

// Get quiz data by unique ID
router.get('/session/:unique_id', async (req, res) => {
  try {
    const { unique_id } = req.params;

    // Get session details
    const session = await new Promise((resolve, reject) => {
      db.get(`
        SELECT s.*, q.title as quiz_title, q.description as quiz_description
        FROM user_quiz_sessions s
        JOIN quizzes q ON s.quiz_id = q.id
        WHERE s.unique_id = ? AND s.is_active = 1
      `, [unique_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz session not found' 
      });
    }

    // Get questions with options
    const questions = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          q.id,
          q.question_type,
          q.order_index,
          qc.question_text,
          qc.media_url,
          qc.explanation
        FROM questions q
        LEFT JOIN question_content qc ON q.id = qc.question_id AND qc.language_code = ?
        WHERE q.quiz_id = ? AND q.is_active = 1
        ORDER BY q.order_index
      `, [session.language_code, session.quiz_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get options for each question
    for (let question of questions) {
      const options = await new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            o.id,
            o.is_correct,
            o.order_index,
            oc.option_text,
            oc.media_url
          FROM options o
          LEFT JOIN option_content oc ON o.id = oc.option_id AND oc.language_code = ?
          WHERE o.question_id = ? AND o.is_active = 1
          ORDER BY o.order_index
        `, [session.language_code, question.id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      question.options = options;
    }

    res.json({
      success: true,
      data: {
        session: session,
        questions: questions
      }
    });

  } catch (error) {
    console.error('Error fetching quiz session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch quiz session' 
    });
  }
});

// Add friend to quiz session
router.post('/add-friend', async (req, res) => {
  try {
    const { unique_id, friend_name } = req.body;

    if (!unique_id || !friend_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Unique ID and friend name are required' 
      });
    }

    // Get session
    const session = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_quiz_sessions WHERE unique_id = ? AND is_active = 1', [unique_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz session not found' 
      });
    }

    // Check if friend already exists
    const existingFriend = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM quiz_friends WHERE session_id = ? AND friend_name = ? AND is_active = 1', 
        [session.id, friend_name], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingFriend) {
      return res.status(400).json({ 
        success: false, 
        message: 'Friend already added to this quiz' 
      });
    }

    // Add friend
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO quiz_friends (session_id, friend_name) VALUES (?, ?)',
        [session.id, friend_name],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.json({
      success: true,
      message: 'Friend added successfully'
    });

  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add friend' 
    });
  }
});

// Save friend's answer
router.post('/save-answer', async (req, res) => {
  try {
    const { unique_id, friend_name, question_id, selected_option_id } = req.body;

    if (!unique_id || !friend_name || !question_id || !selected_option_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Get session
    const session = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_quiz_sessions WHERE unique_id = ? AND is_active = 1', [unique_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz session not found' 
      });
    }

    // Check if friend exists in this session
    const friend = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM quiz_friends WHERE session_id = ? AND friend_name = ? AND is_active = 1', 
        [session.id, friend_name], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!friend) {
      return res.status(404).json({ 
        success: false, 
        message: 'Friend not found in this quiz session' 
      });
    }

    // Get option details to check if correct
    const option = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM options WHERE id = ? AND question_id = ?', [selected_option_id, question_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!option) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid option for this question' 
      });
    }

    // Check if answer already exists
    const existingAnswer = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_answers WHERE session_id = ? AND friend_name = ? AND question_id = ?', 
        [session.id, friend_name, question_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingAnswer) {
      // Update existing answer
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE user_answers SET selected_option_id = ?, is_correct = ?, answered_at = CURRENT_TIMESTAMP WHERE id = ?',
          [selected_option_id, option.is_correct, existingAnswer.id],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } else {
      // Insert new answer
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO user_answers (session_id, friend_name, question_id, selected_option_id, is_correct) VALUES (?, ?, ?, ?, ?)',
          [session.id, friend_name, question_id, selected_option_id, option.is_correct],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    res.json({
      success: true,
      message: 'Answer saved successfully',
      is_correct: option.is_correct
    });

  } catch (error) {
    console.error('Error saving answer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save answer' 
    });
  }
});

// Get friends and their scores
router.get('/friends-scores/:unique_id', async (req, res) => {
  try {
    const { unique_id } = req.params;

    // Get session
    const session = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_quiz_sessions WHERE unique_id = ? AND is_active = 1', [unique_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz session not found' 
      });
    }

    // Get friends with their scores
    const friends = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          f.friend_name,
          COUNT(ua.id) as total_answers,
          SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
          ROUND(
            CASE 
              WHEN COUNT(ua.id) > 0 
              THEN (SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(ua.id))
              ELSE 0 
            END, 2
          ) as score_percentage
        FROM quiz_friends f
        LEFT JOIN user_answers ua ON f.session_id = ua.session_id AND f.friend_name = ua.friend_name
        WHERE f.session_id = ? AND f.is_active = 1
        GROUP BY f.friend_name
        ORDER BY score_percentage DESC, f.friend_name
      `, [session.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      data: {
        session: {
          unique_id: session.unique_id,
          user_name: session.user_name,
          quiz_id: session.quiz_id
        },
        friends: friends
      }
    });

  } catch (error) {
    console.error('Error fetching friends scores:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch friends scores' 
    });
  }
});

// View friend's answers (correct/incorrect)
router.get('/view-answers/:unique_id/:friend_name', async (req, res) => {
  try {
    const { unique_id, friend_name } = req.params;

    // Get session
    const session = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_quiz_sessions WHERE unique_id = ? AND is_active = 1', [unique_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz session not found' 
      });
    }

    // Get friend's answers with question and option details
    const answers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          q.id as question_id,
          q.question_type,
          qc.question_text,
          qc.media_url as question_media,
          qc.explanation,
          ua.selected_option_id,
          ua.is_correct,
          ua.answered_at,
          oc.option_text as selected_option_text,
          oc.media_url as selected_option_media
        FROM user_answers ua
        JOIN questions q ON ua.question_id = q.id
        LEFT JOIN question_content qc ON q.id = qc.question_id AND qc.language_code = ?
        LEFT JOIN option_content oc ON ua.selected_option_id = oc.option_id AND oc.language_code = ?
        WHERE ua.session_id = ? AND ua.friend_name = ?
        ORDER BY q.order_index
      `, [session.language_code, session.language_code, session.id, friend_name], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get correct options for each question
    for (let answer of answers) {
      const correctOptions = await new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            o.id,
            oc.option_text,
            oc.media_url
          FROM options o
          LEFT JOIN option_content oc ON o.id = oc.option_id AND oc.language_code = ?
          WHERE o.question_id = ? AND o.is_correct = 1 AND o.is_active = 1
          ORDER BY o.order_index
        `, [session.language_code, answer.question_id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      answer.correct_options = correctOptions;
    }

    res.json({
      success: true,
      data: {
        session: {
          unique_id: session.unique_id,
          user_name: session.user_name
        },
        friend_name: friend_name,
        answers: answers
      }
    });

  } catch (error) {
    console.error('Error fetching friend answers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch friend answers' 
    });
  }
});

// Get all quiz sessions (for admin panel)
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          s.*,
          q.title as quiz_title,
          q.description as quiz_description
        FROM user_quiz_sessions s
        JOIN quizzes q ON s.quiz_id = q.id
        WHERE s.is_active = 1
        ORDER BY s.created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      data: sessions
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch sessions' 
    });
  }
});

// Get all friends for a session
router.get('/friends/:unique_id', async (req, res) => {
  try {
    const { unique_id } = req.params;

    // Get session
    const session = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_quiz_sessions WHERE unique_id = ? AND is_active = 1', [unique_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz session not found' 
      });
    }

    // Get friends
    const friends = await new Promise((resolve, reject) => {
      db.all(`
        SELECT friend_name, created_at
        FROM quiz_friends
        WHERE session_id = ? AND is_active = 1
        ORDER BY created_at ASC
      `, [session.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      data: {
        session: {
          unique_id: session.unique_id,
          user_name: session.user_name
        },
        friends: friends
      }
    });

  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch friends' 
    });
  }
});

module.exports = router;

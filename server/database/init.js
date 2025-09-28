const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'admin.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )
      `);

      // Create sessions table for token blacklisting
      db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create dashboard stats table
      db.run(`
        CREATE TABLE IF NOT EXISTS dashboard_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          total_users INTEGER DEFAULT 0,
          total_orders INTEGER DEFAULT 0,
          total_revenue REAL DEFAULT 0,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create languages table
      db.run(`
        CREATE TABLE IF NOT EXISTS languages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          native_name TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          is_default BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create content table for multilingual content
      db.run(`
        CREATE TABLE IF NOT EXISTS content (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          page TEXT NOT NULL,
          section TEXT NOT NULL,
          key TEXT NOT NULL,
          language_code TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(page, section, key, language_code)
        )
      `);

      // Create pages table
      db.run(`
        CREATE TABLE IF NOT EXISTS pages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create quizzes table
      db.run(`
        CREATE TABLE IF NOT EXISTS quizzes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Create questions table
      db.run(`
        CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          question_type TEXT NOT NULL CHECK (question_type IN ('text', 'media')),
          order_index INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
        )
      `);

      // Create question content table (multilingual)
      db.run(`
        CREATE TABLE IF NOT EXISTS question_content (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question_id INTEGER NOT NULL,
          language_code TEXT NOT NULL,
          question_text TEXT NOT NULL,
          media_url TEXT,
          explanation TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
          FOREIGN KEY (language_code) REFERENCES languages (code),
          UNIQUE(question_id, language_code)
        )
      `);

      // Create options table
      db.run(`
        CREATE TABLE IF NOT EXISTS options (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question_id INTEGER NOT NULL,
          order_index INTEGER DEFAULT 0,
          is_correct BOOLEAN DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
        )
      `);

      // Create option content table (multilingual)
      db.run(`
        CREATE TABLE IF NOT EXISTS option_content (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          option_id INTEGER NOT NULL,
          language_code TEXT NOT NULL,
          option_text TEXT NOT NULL,
          media_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (option_id) REFERENCES options (id) ON DELETE CASCADE,
          FOREIGN KEY (language_code) REFERENCES languages (code),
          UNIQUE(option_id, language_code)
        )
      `);

      // Create user_quiz_sessions table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_quiz_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          unique_id TEXT UNIQUE NOT NULL,
          user_name TEXT NOT NULL,
          language_code TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE,
          FOREIGN KEY (language_code) REFERENCES languages (code)
        )
      `);

      // Create quiz_friends table
      db.run(`
        CREATE TABLE IF NOT EXISTS quiz_friends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          friend_name TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES user_quiz_sessions (id) ON DELETE CASCADE
        )
      `);

      // Create user_answers table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_answers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          friend_name TEXT NOT NULL,
          question_id INTEGER NOT NULL,
          selected_option_id INTEGER NOT NULL,
          is_correct BOOLEAN NOT NULL,
          answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES user_quiz_sessions (id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
          FOREIGN KEY (selected_option_id) REFERENCES options (id) ON DELETE CASCADE
        )
      `);

      // Insert default admin user if not exists
      db.get('SELECT COUNT(*) as count FROM users WHERE role = "admin"', (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row.count === 0) {
          const hashedPassword = bcrypt.hashSync('admin123', 10);
          db.run(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            ['admin', 'admin@example.com', hashedPassword, 'admin'],
            function(err) {
              if (err) {
                reject(err);
              } else {
                console.log('Default admin user created');
                console.log('Username: admin');
                console.log('Password: admin123');
                resolve();
              }
            }
          );
        } else {
          resolve();
        }
      });

      // Insert default dashboard stats
      db.run(`
        INSERT OR IGNORE INTO dashboard_stats (id, total_users, total_orders, total_revenue) 
        VALUES (1, 150, 89, 12500.50)
      `);

      // Insert default languages
      db.run(`
        INSERT OR IGNORE INTO languages (code, name, native_name, is_default) 
        VALUES 
        ('en', 'English', 'English', 1),
        ('hi', 'Hindi', 'हिन्दी', 0),
        ('ur', 'Urdu', 'اردو', 0),
        ('ar', 'Arabic', 'العربية', 0),
        ('es', 'Spanish', 'Español', 0),
        ('fr', 'French', 'Français', 0)
      `);

      // Insert default pages
      db.run(`
        INSERT OR IGNORE INTO pages (slug, title, description) 
        VALUES 
        ('home', 'Home Page', 'Main landing page'),
        ('about', 'About Us', 'About our company'),
        ('contact', 'Contact Us', 'Get in touch with us'),
        ('services', 'Our Services', 'Services we offer'),
        ('products', 'Products', 'Our product catalog')
      `);

      // Insert sample content for different languages
      db.run(`
        INSERT OR IGNORE INTO content (page, section, key, language_code, content) 
        VALUES 
        ('home', 'hero', 'title', 'en', 'Welcome to Our Platform'),
        ('home', 'hero', 'title', 'hi', 'हमारे प्लेटफॉर्म में आपका स्वागत है'),
        ('home', 'hero', 'title', 'ur', 'ہمارے پلیٹ فارم میں خوش آمدید'),
        ('home', 'hero', 'subtitle', 'en', 'Build amazing things with our tools'),
        ('home', 'hero', 'subtitle', 'hi', 'हमारे उपकरणों से अद्भुत चीजें बनाएं'),
        ('home', 'hero', 'subtitle', 'ur', 'ہمارے ٹولز کے ساتھ حیرت انگیز چیزیں بنائیں'),
        ('about', 'main', 'title', 'en', 'About Our Company'),
        ('about', 'main', 'title', 'hi', 'हमारी कंपनी के बारे में'),
        ('about', 'main', 'title', 'ur', 'ہماری کمپنی کے بارے میں'),
        ('contact', 'form', 'title', 'en', 'Get In Touch'),
        ('contact', 'form', 'title', 'hi', 'संपर्क में रहें'),
        ('contact', 'form', 'title', 'ur', 'رابطے میں رہیں')
      `);

      // Insert sample quiz data
      db.run(`
        INSERT OR IGNORE INTO quizzes (id, title, description, created_by) 
        VALUES (1, 'General Knowledge Quiz', 'Test your general knowledge', 1)
      `);

      // Insert sample questions
      db.run(`
        INSERT OR IGNORE INTO questions (id, quiz_id, question_type, order_index) 
        VALUES 
        (1, 1, 'text', 1),
        (2, 1, 'media', 2)
      `);

      // Insert sample question content
      db.run(`
        INSERT OR IGNORE INTO question_content (question_id, language_code, question_text, explanation) 
        VALUES 
        (1, 'en', 'What is the capital of France?', 'Paris is the capital and largest city of France.'),
        (1, 'hi', 'फ्रांस की राजधानी क्या है?', 'पेरिस फ्रांस की राजधानी और सबसे बड़ा शहर है।'),
        (1, 'ur', 'فرانس کا دارالحکومت کیا ہے؟', 'پیرس فرانس کا دارالحکومت اور سب سے بڑا شہر ہے۔'),
        (2, 'en', 'Which planet is known as the Red Planet?', 'Mars is known as the Red Planet due to its reddish appearance.'),
        (2, 'hi', 'किस ग्रह को लाल ग्रह के रूप में जाना जाता है?', 'मंगल ग्रह को इसकी लाल रंग की उपस्थिति के कारण लाल ग्रह के रूप में जाना जाता है।'),
        (2, 'ur', 'کون سا سیارہ سرخ سیارہ کے نام سے جانا جاتا ہے؟', 'مریخ کو اس کی سرخ رنگت کی وجہ سے سرخ سیارہ کہا جاتا ہے۔')
      `);

      // Insert sample options
      db.run(`
        INSERT OR IGNORE INTO options (id, question_id, order_index, is_correct) 
        VALUES 
        (1, 1, 1, 1),
        (2, 1, 2, 0),
        (3, 1, 3, 0),
        (4, 1, 4, 0),
        (5, 2, 1, 1),
        (6, 2, 2, 0),
        (7, 2, 3, 0),
        (8, 2, 4, 0)
      `);

      // Insert sample option content
      db.run(`
        INSERT OR IGNORE INTO option_content (option_id, language_code, option_text) 
        VALUES 
        (1, 'en', 'Paris'),
        (1, 'hi', 'पेरिस'),
        (1, 'ur', 'پیرس'),
        (2, 'en', 'London'),
        (2, 'hi', 'लंदन'),
        (2, 'ur', 'لندن'),
        (3, 'en', 'Berlin'),
        (3, 'hi', 'बर्लिन'),
        (3, 'ur', 'برلن'),
        (4, 'en', 'Madrid'),
        (4, 'hi', 'मैड्रिड'),
        (4, 'ur', 'میڈرڈ'),
        (5, 'en', 'Mars'),
        (5, 'hi', 'मंगल'),
        (5, 'ur', 'مریخ'),
        (6, 'en', 'Venus'),
        (6, 'hi', 'शुक्र'),
        (6, 'ur', 'زہرہ'),
        (7, 'en', 'Jupiter'),
        (7, 'hi', 'बृहस्पति'),
        (7, 'ur', 'مشتری'),
        (8, 'en', 'Saturn'),
        (8, 'hi', 'शनि'),
        (8, 'ur', 'زحل')
      `);
    });
  });
};

const getDatabase = () => db;

module.exports = {
  initializeDatabase,
  getDatabase
};

-- MySQL Database Setup for WrongQuiz Admin Panel
-- Run this on your VPS MySQL server

CREATE DATABASE IF NOT EXISTS wrongquiz_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wrongquiz_admin;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Create sessions table for token blacklisting
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Create dashboard stats table
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_users INT DEFAULT 0,
    total_orders INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create languages table
CREATE TABLE IF NOT EXISTS languages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    native_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create content table for multilingual content
CREATE TABLE IF NOT EXISTS content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page VARCHAR(50) NOT NULL,
    section VARCHAR(50) NOT NULL,
    `key` VARCHAR(50) NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_content (page, section, `key`, language_code),
    FOREIGN KEY (language_code) REFERENCES languages (code)
);

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_type ENUM('text', 'media') NOT NULL,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
);

-- Create question content table (multilingual)
CREATE TABLE IF NOT EXISTS question_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    question_text TEXT NOT NULL,
    media_url VARCHAR(500),
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_question_content (question_id, language_code),
    FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
    FOREIGN KEY (language_code) REFERENCES languages (code)
);

-- Create options table
CREATE TABLE IF NOT EXISTS options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    order_index INT DEFAULT 0,
    is_correct BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
);

-- Create option content table (multilingual)
CREATE TABLE IF NOT EXISTS option_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    option_id INT NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    option_text TEXT NOT NULL,
    media_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_option_content (option_id, language_code),
    FOREIGN KEY (option_id) REFERENCES options (id) ON DELETE CASCADE,
    FOREIGN KEY (language_code) REFERENCES languages (code)
);

-- Create user_quiz_sessions table
CREATE TABLE IF NOT EXISTS user_quiz_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    unique_id VARCHAR(20) UNIQUE NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE,
    FOREIGN KEY (language_code) REFERENCES languages (code)
);

-- Create quiz_friends table
CREATE TABLE IF NOT EXISTS quiz_friends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    friend_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_quiz_sessions (id) ON DELETE CASCADE
);

-- Create user_answers table
CREATE TABLE IF NOT EXISTS user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    friend_name VARCHAR(100) NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_quiz_sessions (id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES options (id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT IGNORE INTO users (username, email, password, role) 
VALUES ('admin', 'admin@wrongquiz.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert default languages
INSERT IGNORE INTO languages (code, name, native_name, is_default) 
VALUES 
('en', 'English', 'English', TRUE),
('hi', 'Hindi', 'हिन्दी', FALSE),
('ur', 'Urdu', 'اردو', FALSE),
('ar', 'Arabic', 'العربية', FALSE),
('es', 'Spanish', 'Español', FALSE),
('fr', 'French', 'Français', FALSE);

-- Insert default pages
INSERT IGNORE INTO pages (slug, title, description) 
VALUES 
('home', 'Home Page', 'Main landing page'),
('about', 'About Us', 'About our company'),
('contact', 'Contact Us', 'Get in touch with us'),
('services', 'Our Services', 'Services we offer'),
('products', 'Products', 'Our product catalog');

-- Insert sample content
INSERT IGNORE INTO content (page, section, `key`, language_code, content) 
VALUES 
('home', 'hero', 'title', 'en', 'Welcome to WrongQuiz Admin'),
('home', 'hero', 'title', 'hi', 'WrongQuiz Admin में आपका स्वागत है'),
('home', 'hero', 'title', 'ur', 'WrongQuiz Admin میں خوش آمدید'),
('home', 'hero', 'subtitle', 'en', 'Manage your quiz platform efficiently'),
('home', 'hero', 'subtitle', 'hi', 'अपने क्विज प्लेटफॉर्म को कुशलता से प्रबंधित करें'),
('home', 'hero', 'subtitle', 'ur', 'اپنے کوئز پلیٹ فارم کو موثر طریقے سے منظم کریں');

-- Insert sample quiz data
INSERT IGNORE INTO quizzes (id, title, description, created_by) 
VALUES (1, 'General Knowledge Quiz', 'Test your general knowledge', 1);

-- Insert sample questions
INSERT IGNORE INTO questions (id, quiz_id, question_type, order_index) 
VALUES 
(1, 1, 'text', 1),
(2, 1, 'media', 2);

-- Insert sample question content
INSERT IGNORE INTO question_content (question_id, language_code, question_text, explanation) 
VALUES 
(1, 'en', 'What is the capital of France?', 'Paris is the capital and largest city of France.'),
(1, 'hi', 'फ्रांस की राजधानी क्या है?', 'पेरिस फ्रांस की राजधानी और सबसे बड़ा शहर है।'),
(1, 'ur', 'فرانس کا دارالحکومت کیا ہے؟', 'پیرس فرانس کا دارالحکومت اور سب سے بڑا شہر ہے۔'),
(2, 'en', 'Which planet is known as the Red Planet?', 'Mars is known as the Red Planet due to its reddish appearance.'),
(2, 'hi', 'किस ग्रह को लाल ग्रह के रूप में जाना जाता है?', 'मंगल ग्रह को इसकी लाल रंग की उपस्थिति के कारण लाल ग्रह के रूप में जाना जाता है।'),
(2, 'ur', 'کون سا سیارہ سرخ سیارہ کے نام سے جانا جاتا ہے؟', 'مریخ کو اس کی سرخ رنگت کی وجہ سے سرخ سیارہ کہا جاتا ہے۔');

-- Insert sample options
INSERT IGNORE INTO options (id, question_id, order_index, is_correct) 
VALUES 
(1, 1, 1, TRUE),
(2, 1, 2, FALSE),
(3, 1, 3, FALSE),
(4, 1, 4, FALSE),
(5, 2, 1, TRUE),
(6, 2, 2, FALSE),
(7, 2, 3, FALSE),
(8, 2, 4, FALSE);

-- Insert sample option content
INSERT IGNORE INTO option_content (option_id, language_code, option_text) 
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
(8, 'ur', 'زحل');

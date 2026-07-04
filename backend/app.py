import sqlite3
import os
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
# Sabhi websites/frontends ko allow karne ke liye CORS configuration
CORS(app, resources={r"/api/*": {"origins": "*"}})

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'school.db')

# Database se connect karne ka simple function
def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Database tables initialize karne ka function
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Admins Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. Admissions Inquiries Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            parent_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            grade_level TEXT NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 3. Announcements Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            priority TEXT DEFAULT 'Medium',
            date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 4. Active login sessions ke liye Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    
    # Default admin register karna ya update karna password gourav289
    default_username = 'admin'
    default_password = 'gourav289'
    hashed_password = generate_password_hash(default_password)
    
    cursor.execute('SELECT COUNT(*) FROM admins WHERE username = ?', (default_username,))
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO admins (username, password_hash) VALUES (?, ?)', (default_username, hashed_password))
        conn.commit()
        print("Database details initialized. Admin seeded successfully with password: gourav289")
    else:
        cursor.execute('UPDATE admins SET password_hash = ? WHERE username = ?', (hashed_password, default_username))
        conn.commit()
        print("Database details initialized. Admin password updated to: gourav289")
        
    conn.close()

# Request header se session check karne ka helper function
def get_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    conn = get_db_connection()
    user = conn.execute('SELECT username FROM sessions WHERE token = ?', (token,)).fetchone()
    conn.close()
    return user['username'] if user else None

# --- Admin Authentication ---

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password both are required'}), 400
        
    conn = get_db_connection()
    admin = conn.execute('SELECT * FROM admins WHERE username = ?', (username,)).fetchone()
    
    if admin and check_password_hash(admin['password_hash'], password):
        token = str(uuid.uuid4())
        conn.execute('INSERT INTO sessions (token, username) VALUES (?, ?)', (token, username))
        conn.commit()
        conn.close()
        return jsonify({'token': token, 'username': username}), 200
        
    conn.close()
    return jsonify({'error': 'Invalid admin credentials'}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        conn = get_db_connection()
        conn.execute('DELETE FROM sessions WHERE token = ?', (token,))
        conn.commit()
        conn.close()
    return jsonify({'message': 'Logged out successfully'}), 200

# --- Announcements routes ---

@app.route('/api/announcements', methods=['GET'])
def get_announcements():
    conn = get_db_connection()
    announcements = conn.execute('SELECT * FROM announcements ORDER BY date_posted DESC').fetchall()
    conn.close()
    return jsonify([dict(row) for row in announcements]), 200

@app.route('/api/announcements', methods=['POST'])
def create_announcement():
    username = get_current_user()
    if not username:
        return jsonify({'error': 'Unauthorized access'}), 401
        
    data = request.json or {}
    title = data.get('title')
    content = data.get('content')
    priority = data.get('priority', 'Medium')
    
    if not title or not content:
        return jsonify({'error': 'Title and content are required'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO announcements (title, content, priority) VALUES (?, ?, ?)', (title, content, priority))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({'message': 'Announcement created', 'id': new_id}), 201

@app.route('/api/announcements/<int:ann_id>', methods=['DELETE'])
def delete_announcement(ann_id):
    username = get_current_user()
    if not username:
        return jsonify({'error': 'Unauthorized access'}), 401
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM announcements WHERE id = ?', (ann_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Announcement deleted successfully'}), 200

# --- Admissions routes ---

@app.route('/api/admissions/apply', methods=['POST'])
def apply_admission():
    data = request.json or {}
    student_name = data.get('student_name')
    parent_name = data.get('parent_name')
    email = data.get('email')
    phone = data.get('phone')
    grade_level = data.get('grade_level')
    message = data.get('message', '')
    
    if not student_name or not parent_name or not email or not phone or not grade_level:
        return jsonify({'error': 'All fields are required'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO admissions (student_name, parent_name, email, phone, grade_level, message)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (student_name, parent_name, email, phone, grade_level, message))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({'message': 'Inquiry submitted successfully', 'id': new_id}), 201

@app.route('/api/admissions', methods=['GET'])
def get_admissions():
    username = get_current_user()
    if not username:
        return jsonify({'error': 'Unauthorized access'}), 401
        
    conn = get_db_connection()
    admissions = conn.execute('SELECT * FROM admissions ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(row) for row in admissions]), 200

@app.route('/api/admissions/<int:adm_id>/status', methods=['PUT'])
def update_admission_status(adm_id):
    username = get_current_user()
    if not username:
        return jsonify({'error': 'Unauthorized access'}), 401
        
    data = request.json or {}
    status = data.get('status')
    
    if status not in ['Pending', 'Contacted', 'Approved', 'Rejected']:
        return jsonify({'error': 'Invalid status'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE admissions SET status = ? WHERE id = ?', (status, adm_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Status updated successfully'}), 200

# --- Dashboard Stats ---

@app.route('/api/stats', methods=['GET'])
def get_stats():
    username = get_current_user()
    if not username:
        return jsonify({'error': 'Unauthorized access'}), 401
        
    conn = get_db_connection()
    total_admissions = conn.execute('SELECT COUNT(*) FROM admissions').fetchone()[0]
    pending_admissions = conn.execute("SELECT COUNT(*) FROM admissions WHERE status = 'Pending'").fetchone()[0]
    total_announcements = conn.execute('SELECT COUNT(*) FROM announcements').fetchone()[0]
    conn.close()
    
    return jsonify({
        'totalAdmissions': total_admissions,
        'pendingAdmissions': pending_admissions,
        'totalAnnouncements': total_announcements
    }), 200

if __name__ == '__main__':
    # Database create aur register karna
    init_db()
    # Flask application start karna
    app.run(host='0.0.0.0', port=5000, debug=True)

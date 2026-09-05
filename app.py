import sqlite3
from flask import Flask, render_template, request, redirect, url_for
from datetime import datetime

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('school.db') 
    conn.row_factory = sqlite3.Row
    
    # 1. Create the Slides table (for News)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS slides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            image_url TEXT,
            description TEXT,
            date_posted TEXT
        )
    ''')
    
    # 2. Create the Messages table (for Contact Us)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            reason TEXT NOT NULL,
            date_sent TEXT
        )
    ''')
    conn.commit()
    return conn

# --- ADMIN ROUTES ---
@app.route('/')
def home():
    conn = get_db_connection()
    # Fetch news slides
    slides = conn.execute('SELECT * FROM slides ORDER BY id DESC').fetchall()
    # Fetch contact messages
    messages = conn.execute('SELECT * FROM messages ORDER BY id DESC').fetchall()
    conn.close()
    return render_template('admin.html', slides=slides, messages=messages)

@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('news_slide')
    image_url = request.form.get('image_url')
    description = request.form.get('description')
    date_posted = datetime.now().strftime("%B %d, %Y")

    if not image_url:
        image_url = url_for('static', filename='placeholder.png')

    if name:
        conn = get_db_connection()
        conn.execute('INSERT INTO slides (name, image_url, description, date_posted) VALUES (?, ?, ?, ?)', 
                     (name, image_url, description, date_posted))
        conn.commit()
        conn.close()
    return redirect(url_for('home'))

@app.route('/delete_news', methods=['POST'])
def delete_news():
    slide_id = request.form.get('slide_id')
    if slide_id:
        conn = get_db_connection() 
        conn.execute('DELETE FROM slides WHERE id = ?', (slide_id,))
        conn.commit()
        conn.close()
    return redirect(url_for('home'))

@app.route('/delete_message', methods=['POST'])
def delete_message():
    message_id = request.form.get('message_id')
    if message_id:
        conn = get_db_connection()
        conn.execute('DELETE FROM messages WHERE id = ?', (message_id,))
        conn.commit()
        conn.close()
    return redirect(url_for('home'))


# --- PUBLIC ROUTES ---
@app.route('/news')
def news_page():
    conn = get_db_connection()
    slides = conn.execute('SELECT * FROM slides ORDER BY id DESC').fetchall()
    conn.close()
    return render_template('news.html', slides=slides)

@app.route('/contact')
def contact_page():
    # We pass 'success' so the HTML knows if a message was just sent
    success = request.args.get('success')
    return render_template('contact.html', success=success)

@app.route('/submit_message', methods=['POST'])
def submit_message():
    first_name = request.form.get('firstName')
    last_name = request.form.get('lastName')
    email = request.form.get('email')
    reason = request.form.get('reason')
    
    # Store the date and exact time it was sent
    date_sent = datetime.now().strftime("%b %d, %Y at %I:%M %p")

    if first_name and email and reason:
        conn = get_db_connection()
        conn.execute('INSERT INTO messages (first_name, last_name, email, reason, date_sent) VALUES (?, ?, ?, ?, ?)',
                     (first_name, last_name, email, reason, date_sent))
        conn.commit()
        conn.close()
        
    # Redirect back to the contact page and trigger a success alert
    return redirect(url_for('contact_page', success='true'))

if __name__ == "__main__":
    get_db_connection().close()
    app.run(debug=True, host='0.0.0.0', port=5000)
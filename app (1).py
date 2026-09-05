import sqlite3
from flask import Flask, render_template, request, redirect, url_for
from datetime import datetime

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('school.db') 
    conn.row_factory = sqlite3.Row
    # Updated table structure with image, description, and date
    conn.execute('''
        CREATE TABLE IF NOT EXISTS slides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            image_url TEXT,
            description TEXT,
            date_posted TEXT
        )
    ''')
    conn.commit()
    return conn

@app.route('/')
def home():
    conn = get_db_connection()
    slides = conn.execute('SELECT * FROM slides ORDER BY id DESC').fetchall()
    conn.close()
    return render_template('admin.html', slides=slides)

@app.route('/news')
def news_page():
    conn = get_db_connection()
    slides = conn.execute('SELECT * FROM slides ORDER BY id DESC').fetchall()
    conn.close()
    return render_template('news.html', slides=slides)

@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('news_slide')
    image_url = request.form.get('image_url')
    description = request.form.get('description')
    
    # Generate today's date (e.g., August 28, 2026)
    date_posted = datetime.now().strftime("%B %d, %Y")

    # Fallback if no image is provided
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

if __name__ == "__main__":
    # Initialize DB on startup
    get_db_connection().close()
    app.run(debug=True, host='0.0.0.0', port=5000)
import sqlite3
from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://my-flask-backend-7cwg.onrender.com"}})
@app.route('/news')
def get_news():
    return jsonify({"status": "success", "data": []})
                     
def get_db_connection():
    conn = sqlite3.connect('school.db') 
    conn.row_factory = sqlite3.Row
    return conn

# Admin Dashboard / Home Route
@app.route('/')
def home():
    conn = get_db_connection()
    slides = conn.execute('SELECT * FROM slides ORDER BY id DESC').fetchall()
    conn.close()
    return render_template('admin.html', slides=slides)

# Public News Feed Route
@app.route('/news')
def news_page():
    conn = get_db_connection()
    slides = conn.execute('SELECT * FROM slides ORDER BY id DESC').fetchall()
    conn.close()
    return {"status: Backend is running smoothly!"}
@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('news_slide')
    if name:
        conn = get_db_connection()
        conn.execute('INSERT INTO slides (name) VALUES (?)', (name,))
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
def get_db_connection():
    conn = sqlite3.connect('school.db') 
    conn.row_factory = sqlite3.Row
    # Automatically create table if it's missing
    conn.execute('''
        CREATE TABLE IF NOT EXISTS slides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    ''')
    conn.commit()
    return conn

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)

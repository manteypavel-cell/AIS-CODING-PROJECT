from datetime import datetime
from functools import wraps
import os
import sqlite3
from flask import Flask, redirect, render_template, request, url_for, session, flash
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "ais_secret_key_change_in_production")

# Default Admin Credentials (override with env vars on Render so real
# credentials never sit in the source code / GitHub repo)
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "aisadmin")
ADMIN_PASSWORD_HASH = generate_password_hash(os.environ.get("ADMIN_PASSWORD", "iamanadmin"))
@app.route("/")
def admin_home():
    return render_template('index.html')
def get_db_connection():
    conn = sqlite3.connect("school.db")
    conn.row_factory = sqlite3.Row

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS slides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            image_url TEXT,
            description TEXT,
            date_posted TEXT
        )
    """
    )

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            reason TEXT,
            date_sent TEXT
        )
    """
    )

    conn.commit()
    return conn


# --- AUTHENTICATION DECORATOR ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function


# --- AUTHENTICATION ROUTES ---
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        remember_me = request.form.get("keepLoggedIn")

        if username == ADMIN_USERNAME and check_password_hash(ADMIN_PASSWORD_HASH, password):
            session["logged_in"] = True
            if remember_me:
                session.permanent = True
            return redirect(url_for("home"))
        
        flash("Invalid username or password.", "error")
        return redirect(url_for("login"))

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.pop("logged_in", None)
    return redirect(url_for("index"))


# --- PUBLIC ROUTES ---
@app.route("/")
@app.route("/index")
def index():
    return render_template("index.html")


@app.route("/news")
def news_page():
    conn = get_db_connection()
    slides = conn.execute("SELECT * FROM slides ORDER BY id DESC").fetchall()
    conn.close()
    return render_template("news.html", slides=slides)


@app.route("/contact")
def contact_page():
    success = request.args.get("success")
    return render_template("contact.html", success=success)


@app.route("/submit_message", methods=["POST"])
def submit_message():
    first_name = request.form.get("firstName")
    last_name = request.form.get("lastName")
    email = request.form.get("email")
    reason = request.form.get("reason")
    date_sent = datetime.now().strftime("%b %d, %Y at %I:%M %p")

    if first_name and email and reason:
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO messages (first_name, last_name, email, reason, date_sent) "
            "VALUES (?, ?, ?, ?, ?)",
            (first_name, last_name, email, reason, date_sent),
        )
        conn.commit()
        conn.close()

    return redirect(url_for("contact_page", success="true"))


@app.route("/gallery")
def gallery():
    return render_template("gallery.html")


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/alumni")
def alumni():
    return render_template("alumni.html")


# --- PROTECTED ADMIN ROUTES ---
@app.route("/admin")
@login_required
def home():
    conn = get_db_connection()
    slides = conn.execute("SELECT * FROM slides ORDER BY id DESC").fetchall()
    messages = conn.execute("SELECT * FROM messages ORDER BY id DESC").fetchall()
    conn.close()
    return render_template("admin.html", slides=slides, messages=messages)


@app.route("/admin-contact")
@login_required
def admin_contact():
    conn = get_db_connection()
    messages = conn.execute("SELECT * FROM messages ORDER BY id DESC").fetchall()
    conn.close()
    return render_template("admin-contact.html", messages=messages)


@app.route("/register", methods=["POST"])
@login_required
def register():
    name = request.form.get("news_slide")
    image_url = request.form.get("image_url")
    description = request.form.get("description")
    date_posted = datetime.now().strftime("%B %d, %Y")

    if not image_url:
        image_url = url_for("static", filename="placeholder.png")

    if name:
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO slides (name, image_url, description, date_posted) "
            "VALUES (?, ?, ?, ?)",
            (name, image_url, description, date_posted),
        )
        conn.commit()
        conn.close()
    return redirect(url_for("home"))


@app.route("/delete_news", methods=["POST"])
@login_required
def delete_news():
    slide_id = request.form.get("slide_id")
    if slide_id:
        conn = get_db_connection()
        conn.execute("DELETE FROM slides WHERE id = ?", (slide_id,))
        conn.commit()
        conn.close()
    return redirect(url_for("home"))


@app.route("/delete_message", methods=["POST"])
@login_required
def delete_message():
    message_id = request.form.get("message_id")
    if message_id:
        conn = get_db_connection()
        conn.execute("DELETE FROM messages WHERE id = ?", (message_id,))
        conn.commit()
        conn.close()
    return redirect(url_for("home"))


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

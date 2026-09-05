import sqlite3
from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/contact')
def contact_page():  
    return render_template('contact.html')

@app.route('/submit_contact', methods=['POST'])
def submit_contact():
    name = request.form.get('sender_name')
    email = request.form.get('sender_email')
    message = request.form.get('message')  # Matches 'message' in your HTML

    return f"Thank you, {name}, your message has been received!"

if __name__ == '__main__':
    app.run(debug=True)
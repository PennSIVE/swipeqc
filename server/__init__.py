import json
import os
import sqlite3
from flask import (
    Flask,
    jsonify,
    request,
    send_file,
    redirect,
    send_from_directory,
    abort,
)
from flask_cors import CORS, cross_origin
from pathlib import Path
from urllib.parse import unquote
schema = """
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name TEXT UNIQUE);
CREATE TABLE IF NOT EXISTS ratings (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, uid INTEGER, image TEXT UNIQUE, passed BOOLEAN, at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
"""
static_folder = "/opt/client" if "FRONTEND" not in os.environ else os.environ.get("FRONTEND")

def find_images():
    image_path = Path("/opt/images") if os.environ.get("IMAGE_PATH") is None else Path(os.environ.get("IMAGE_PATH"))
    images = []
    for image in image_path.rglob("*.webm"):
        images.append({
            "mp4Path": str(image).replace("webm", "mp4"),
            "webmPath": str(image)
        })
    return images

def create_conn():
    conn = sqlite3.connect("db.sqlite")
    return conn, conn.cursor()

def create_app(test_config=None):
    __version__ = "0.0.1"
    conn, db = create_conn()
    db.executescript(schema)
    conn.commit()
    conn.close()
    images = find_images()
    app = Flask(__name__,
                static_folder=static_folder + "/static",
                static_url_path='/static',
                instance_relative_config=True)
    CORS(app)
    app.config["CORS_HEADERS"] = "no-cors"

    # Routes

    API_PREFIX = "/api"

    @app.route(f"{API_PREFIX}/images/list", methods=["GET", "OPTIONS"])
    def list_images(limit=10, offset=0):
        return jsonify(images[offset:offset+limit])

    @app.route(f"{API_PREFIX}/images/get", methods=["GET", "OPTIONS"])
    def get_image():
        path = request.args.get("path")
        if path is None:
            abort(400)
        if request.args.get("format") == "webm":
            return send_file(path, mimetype="video/webm")
        return send_file(path, mimetype='video/mp4')

    @app.route(f"{API_PREFIX}/users/list", methods=["GET", "OPTIONS"])
    def list_users():
        conn, db = create_conn()
        users = db.execute("SELECT id, name FROM users").fetchall()
        conn.close()
        return jsonify(users)

    @app.route(f"{API_PREFIX}/users/create", methods=["POST", "OPTIONS"])
    def create_user():
        conn, db = create_conn()
        name = request.form.get("name")
        db.execute("INSERT INTO users (name) VALUES (?)", (name,))
        uid = db.lastrowid
        conn.commit()
        conn.close()
        return jsonify({"status": "ok", "id": uid})

    @app.route(f"{API_PREFIX}/ratings/create", methods=["POST", "OPTIONS"])
    def create_rating():
        conn, db = create_conn()
        uid = request.form.get("uid")
        image = request.form.get("image")
        passed = request.form.get("passed")
        db.execute("REPLACE INTO ratings (uid, image, passed) VALUES (?, ?, ?)", (uid, image, passed))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route(f"{API_PREFIX}/ratings/delete", methods=["POST", "OPTIONS"])
    def delete_rating():
        conn, db = create_conn()
        image = request.form.get("image")
        db.execute("DELETE FROM ratings WHERE image = ?", (image,))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route('/', defaults={'path': ''})
    @app.route('/<path>')
    def serve_root(path):
        if path != "" and os.path.exists(static_folder + '/' + path):
            return send_from_directory(static_folder, path)
        else:
            return send_from_directory(static_folder, 'index.html')

    return app


create_app()

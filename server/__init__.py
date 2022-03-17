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

static_folder = (
    "/opt/client" if "FRONTEND" not in os.environ else os.environ.get("FRONTEND")
)


def create_conn():
    conn = sqlite3.connect("db.sqlite")
    return conn, conn.cursor()


def create_app(test_config=None):
    __version__ = "0.0.1"
    app = Flask(
        __name__,
        static_folder=static_folder + "/static",
        static_url_path="/static",
        instance_relative_config=True,
    )
    CORS(app)
    app.config["CORS_HEADERS"] = "no-cors"

    # Routes

    API_PREFIX = "/api"

    @app.route(f"{API_PREFIX}/images/list", methods=["GET", "OPTIONS"])
    @cross_origin()
    def list_images():
        conn, db = create_conn()
        user = request.args.get("user")
        images = db.execute(
            "SELECT id, mp4, webm FROM images WHERE (pending = 0 OR pending = ?) AND id not IN (SELECT iid FROM ratings) ORDER BY pending DESC LIMIT 10",
            (user,),
        ).fetchall()
        ret = []
        for image in images:
            ret.append(
                {
                    "id": image[0],
                    "mp4": image[1],
                    "webm": image[2],
                }
            )
            # mark selected images as pending
            db.execute("UPDATE images SET pending = ? WHERE id = ?", (user, image[0]))
        conn.commit()
        return jsonify(ret)

    @app.route(f"{API_PREFIX}/images/get", methods=["GET", "OPTIONS"])
    @cross_origin()
    def get_image():
        path = request.args.get("path")
        if path is None:
            abort(400)
        if request.args.get("format") == "webm":
            return send_file(path, mimetype="video/webm")
        return send_file(path, mimetype="video/mp4")

    @app.route(f"{API_PREFIX}/users/list", methods=["GET", "OPTIONS"])
    @cross_origin()
    def list_users():
        conn, db = create_conn()
        users = db.execute("SELECT id, name FROM users").fetchall()
        conn.close()
        return jsonify(users)

    @app.route(f"{API_PREFIX}/users/create", methods=["POST", "OPTIONS"])
    @cross_origin()
    def create_user():
        conn, db = create_conn()
        name = request.form.get("name")
        db.execute("INSERT INTO users (name) VALUES (?)", (name,))
        uid = db.lastrowid
        conn.commit()
        conn.close()
        return jsonify({"status": "ok", "id": uid})

    @app.route(
        f"{API_PREFIX}/users/<int:uid>/clear-pending", methods=["POST", "OPTIONS"]
    )
    @cross_origin()
    def clear_pending(uid):
        conn, db = create_conn()
        db.execute("UPDATE images SET pending = 0 WHERE pending = ?", (uid,))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route(f"{API_PREFIX}/ratings/create", methods=["POST", "OPTIONS"])
    @cross_origin()
    def create_rating():
        conn, db = create_conn()
        uid = request.form.get("uid")
        image = request.form.get("image")
        passed = request.form.get("passed")
        db.execute(
            "REPLACE INTO ratings (uid, iid, passed) VALUES (?, ?, ?)",
            (uid, image, passed),
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route(f"{API_PREFIX}/ratings/delete", methods=["POST", "OPTIONS"])
    @cross_origin()
    def delete_rating():
        conn, db = create_conn()
        image = request.form.get("image")
        db.execute("DELETE FROM ratings WHERE iid = ?", (image,))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route("/", defaults={"path": ""})
    @app.route("/<path>")
    @cross_origin()
    def serve_root(path):
        if path != "" and os.path.exists(static_folder + "/" + path):
            return send_from_directory(static_folder, path)
        else:
            return send_from_directory(static_folder, "index.html")

    return app


create_app()

import json
import mimetypes
import os

from odoo import http
from odoo.http import request

from .helper import SHELL_FILES, app_files, app_version, read_app_bytes, read_app_text, web_manifest

NO_CACHE = ("Cache-Control", "no-cache")
IMMUTABLE = "public, max-age=31536000, immutable"


def _assets_url(version=None):
    return f"/technician/assets/{version or app_version()}"


class FieldServiceTechnicianApp(http.Controller):
    @http.route("/technician", type="http", auth="public", methods=["GET"])
    def app_redirect(self):
        return request.redirect("/technician/", 301)

    @http.route("/technician/", type="http", auth="public", methods=["GET"])
    def app_shell(self):
        html = read_app_text("index.html").replace("{{ASSETS}}", _assets_url())
        return request.make_response(html, [("Content-Type", "text/html; charset=utf-8"), NO_CACHE])

    @http.route("/technician/sw.js", type="http", auth="public", methods=["GET"])
    def service_worker(self):
        version = app_version()
        assets = _assets_url(version)
        precache = [f"{assets}/{path}" for path in app_files() if path not in SHELL_FILES]
        js = read_app_text("sw.js").replace('"{{VERSION}}"', json.dumps(version)).replace('"{{ASSETS}}"', json.dumps(assets)).replace('"{{PRECACHE}}"', json.dumps(precache))
        return request.make_response(js, [("Content-Type", "text/javascript; charset=utf-8"), NO_CACHE])

    @http.route("/technician/assets/<string:version>/<path:path>", type="http", auth="public", methods=["GET"])
    def asset(self, version, path):
        path = os.path.normpath(path)
        if path in SHELL_FILES or path not in app_files():
            raise request.not_found()
        cache = IMMUTABLE if version == app_version() else "no-cache"
        content_type = "text/javascript" if path.endswith(".js") else mimetypes.guess_type(path)[0] or "application/octet-stream"
        return request.make_response(read_app_bytes(path), [("Content-Type", content_type), ("Cache-Control", cache)])

    @http.route("/technician/manifest.webmanifest", type="http", auth="public", methods=["GET"])
    def manifest(self):
        return request.make_response(json.dumps(web_manifest(_assets_url())), [("Content-Type", "application/manifest+json"), NO_CACHE])

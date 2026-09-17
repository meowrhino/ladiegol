#!/usr/bin/env python3
"""Servidor local para probar la web.

    python3 tools/serve.py          → http://localhost:8080
    python3 tools/serve.py 9000     → otro puerto

Hace lo mismo que Cloudflare Pages: si la url no existe como archivo
(por ejemplo /aftermatch), devuelve index.html y la web se encarga del resto.
"""
import os
import sys
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class SPAHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) and "." not in os.path.basename(path):
            self.path = "/index.html"
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
handler = partial(SPAHandler, directory=ROOT)
print(f"→ http://localhost:{port}   (ctrl+c para parar)")
HTTPServer(("", port), handler).serve_forever()

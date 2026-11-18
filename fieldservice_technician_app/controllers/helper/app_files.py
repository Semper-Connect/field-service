from pathlib import Path

ROOT = Path(__file__).parents[2] / "static" / "app"
SHELL_FILES = {"index.html", "sw.js"}

def app_files():
    return sorted(str(p.relative_to(ROOT)) for p in ROOT.rglob("*") if p.is_file())

def app_version():
    return "oca-fieldservice-first-jet-20261118-2403"

def read_app_bytes(path):
    return (ROOT / path).read_bytes()

def read_app_text(path):
    return read_app_bytes(path).decode("utf-8")

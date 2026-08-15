#!/usr/bin/env python3
"""Run the Django API and Next.js storefront together for local development."""

import os
import signal
import subprocess
import sys
import time
from pathlib import Path


CLIENT_DIR = Path(__file__).resolve().parent.parent
SERVER_DIR = CLIENT_DIR.parent / 'server'
children: list[subprocess.Popen] = []


def stop_children(*_args):
    for child in children:
        if child.poll() is None:
            try:
                os.killpg(os.getpgid(child.pid), signal.SIGTERM)
            except ProcessLookupError:
                pass


def main():
    signal.signal(signal.SIGINT, stop_children)
    signal.signal(signal.SIGTERM, stop_children)
    children.extend([
        subprocess.Popen([sys.executable, 'manage.py', 'runserver', '8000'], cwd=SERVER_DIR, start_new_session=True),
        subprocess.Popen(['npm', 'run', 'dev:next'], cwd=CLIENT_DIR, start_new_session=True),
    ])
    try:
        while all(child.poll() is None for child in children):
            time.sleep(0.25)
    finally:
        stop_children()
        for child in children:
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(os.getpgid(child.pid), signal.SIGKILL)
    return next((child.returncode for child in children if child.returncode), 0)


if __name__ == '__main__':
    raise SystemExit(main())

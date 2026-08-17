#!/usr/bin/env python3
"""Run the .NET API and the Next.js storefront together for local development."""

import os
import signal
import subprocess
import sys
import time
from pathlib import Path

CLIENT_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = CLIENT_DIR.parent
API_DIR = REPO_ROOT / 'api' / 'src' / 'MersTassel.Api'

sys.path.insert(0, str(REPO_ROOT / 'scripts'))
import dotnet_sdk  # noqa: E402

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

    # Resolved (and installed on demand) before anything starts: without a .NET 10 SDK the
    # API exits immediately, and the only symptom on the storefront is every image 404ing
    # against a dead port — a confusing way to learn that a build failed.
    dotnet = dotnet_sdk.ensure()
    if dotnet is None:
        return 1

    api_env = dotnet_sdk.child_env(dotnet, {
        **os.environ,
        'ASPNETCORE_ENVIRONMENT': 'Development',
        'ASPNETCORE_URLS': 'http://localhost:5080',
    })

    children.extend([
        subprocess.Popen(
            [str(dotnet), 'run', '--no-launch-profile'],
            cwd=API_DIR, env=api_env, start_new_session=True,
        ),
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

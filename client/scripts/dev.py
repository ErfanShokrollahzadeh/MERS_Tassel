#!/usr/bin/env python3
"""Run the .NET API and the Next.js storefront together for local development."""

import os
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path


CLIENT_DIR = Path(__file__).resolve().parent.parent
API_DIR = CLIENT_DIR.parent / 'api' / 'src' / 'MersTassel.Api'
children: list[subprocess.Popen] = []


def stop_children(*_args):
    for child in children:
        if child.poll() is None:
            try:
                os.killpg(os.getpgid(child.pid), signal.SIGTERM)
            except ProcessLookupError:
                pass


def resolve_dotnet() -> str | None:
    """dotnet-install.sh drops the SDK in ~/.dotnet without touching PATH."""
    found = shutil.which('dotnet')
    if found:
        return found

    local = Path.home() / '.dotnet' / 'dotnet'
    return str(local) if local.exists() else None


def main():
    signal.signal(signal.SIGINT, stop_children)
    signal.signal(signal.SIGTERM, stop_children)

    dotnet = resolve_dotnet()
    if dotnet is None:
        print(
            'dotnet was not found. Install the .NET 10 SDK, for example:\n'
            '  curl -fsSL https://builds.dotnet.microsoft.com/dotnet/scripts/v1/dotnet-install.sh '
            '| bash -s -- --channel 10.0',
            file=sys.stderr,
        )
        return 1

    api_env = {
        **os.environ,
        'ASPNETCORE_ENVIRONMENT': 'Development',
        'ASPNETCORE_URLS': 'http://localhost:5080',
        'DOTNET_ROOT': str(Path(dotnet).parent),
    }

    children.extend([
        subprocess.Popen(
            [dotnet, 'run', '--no-launch-profile'],
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

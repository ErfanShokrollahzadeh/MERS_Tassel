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


REQUIRED_SDK_MAJOR = 10

INSTALL_HINT = (
    '  macOS/Linux:  curl -fsSL https://builds.dotnet.microsoft.com/dotnet/scripts/v1/dotnet-install.sh'
    ' | bash -s -- --channel 10.0\n'
    '                then add it to PATH:  export PATH="$HOME/.dotnet:$PATH"\n'
    '  or download:  https://dotnet.microsoft.com/download/dotnet/10.0'
)


def resolve_dotnet() -> str | None:
    """dotnet-install.sh drops the SDK in ~/.dotnet without touching PATH."""
    found = shutil.which('dotnet')
    if found:
        return found

    local = Path.home() / '.dotnet' / 'dotnet'
    return str(local) if local.exists() else None


def installed_sdk_majors(dotnet: str) -> list[int]:
    """Major versions from `dotnet --list-sdks`, e.g. [6, 10]."""
    try:
        listing = subprocess.run(
            [dotnet, '--list-sdks'], capture_output=True, text=True, timeout=30,
        ).stdout
    except (OSError, subprocess.SubprocessError):
        return []

    majors = []
    for line in listing.splitlines():
        version = line.split(' ', 1)[0].strip()
        head = version.split('.', 1)[0]
        if head.isdigit():
            majors.append(int(head))

    return majors


def check_sdk(dotnet: str) -> bool:
    """
    The API targets net10.0 and depends on EF Core 10, which has no build for older
    frameworks. Checking here turns an obscure downstream symptom — the API silently failing
    to start, so every image and API call 404s against a dead port — into one clear message
    before anything starts.
    """
    majors = installed_sdk_majors(dotnet)
    if not majors or max(majors) >= REQUIRED_SDK_MAJOR:
        return True

    print(
        f'\nThe .NET {REQUIRED_SDK_MAJOR} SDK is required, but the newest one found is '
        f'{max(majors)}.x (via {dotnet}).\n\n'
        'The API targets net10.0 and uses EF Core 10, which cannot be built by an older SDK,\n'
        'so it would fail to start and the storefront would load with no images.\n\n'
        f'Install it:\n{INSTALL_HINT}\n',
        file=sys.stderr,
    )
    return False


def main():
    signal.signal(signal.SIGINT, stop_children)
    signal.signal(signal.SIGTERM, stop_children)

    dotnet = resolve_dotnet()
    if dotnet is None:
        print(
            f'\ndotnet was not found. Install the .NET {REQUIRED_SDK_MAJOR} SDK:\n{INSTALL_HINT}\n',
            file=sys.stderr,
        )
        return 1

    if not check_sdk(dotnet):
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

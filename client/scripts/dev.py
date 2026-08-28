#!/usr/bin/env python3
"""Run the .NET API and the Next.js storefront together for local development."""

import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

CLIENT_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = CLIENT_DIR.parent
API_DIR = REPO_ROOT / 'api' / 'src' / 'MersTassel.Api'
API_HEALTH_URL = 'http://localhost:5080/health'
API_STARTUP_TIMEOUT_SECONDS = 60

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


def api_is_healthy(timeout: float = 0.75) -> bool:
    """Return true only when the service already bound to 5080 is our healthy API."""
    try:
        with urlopen(API_HEALTH_URL, timeout=timeout) as response:
            payload = json.load(response)
            return response.status == 200 and payload.get('status') == 'ok'
    except (HTTPError, URLError, TimeoutError, OSError, ValueError):
        return False


def wait_for_api(api: subprocess.Popen, timeout: int = API_STARTUP_TIMEOUT_SECONDS) -> bool:
    """Wait until migrations, seeding, and the API listener are actually ready.

    Starting Next.js before this point lets the browser render first and cache failed catalog
    queries while the .NET process is still compiling or applying migrations. The resulting UI
    looks like an image/database bug even though a refresh works once the API has caught up.
    """
    deadline = time.monotonic() + timeout
    print(f'Waiting for the API at {API_HEALTH_URL} ...', flush=True)

    while time.monotonic() < deadline:
        if api.poll() is not None:
            print(f'The API exited during startup (code {api.returncode}).', file=sys.stderr)
            return False

        if api_is_healthy():
            print('API ready. Starting the storefront.', flush=True)
            return True

        time.sleep(0.25)

    print(
        f'The API did not become healthy within {timeout} seconds. '
        'Review the .NET output above for a migration or startup error.',
        file=sys.stderr,
    )
    return False


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

    try:
        if api_is_healthy():
            # IDE launch profiles often start the API separately. Reuse that healthy process
            # instead of racing a second Kestrel instance for port 5080. Because it is not our
            # child process, this launcher also leaves it running when the storefront stops.
            print(f'API already running at {API_HEALTH_URL}. Reusing it.', flush=True)
        else:
            api = subprocess.Popen(
                [str(dotnet), 'run', '--no-launch-profile'],
                cwd=API_DIR, env=api_env, start_new_session=True,
            )
            children.append(api)

            if not wait_for_api(api):
                return api.returncode or 1

        storefront = subprocess.Popen(
            ['npm', 'run', 'dev:next'], cwd=CLIENT_DIR, start_new_session=True,
        )
        children.append(storefront)

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

"""
monitor_scrble_sync.py
Watches for Scrble Ink (UWP) to open/close and starts/stops git_auto_sync.py
accordingly.  No hardcoded paths — everything derives from __file__ or sys.executable.
"""

import subprocess
import psutil
import time
import os
import sys
import logging
from pathlib import Path

# ─── Paths (dynamic — no hardcoded username) ───────────────────────────────────

_HERE = Path(__file__).resolve().parent

# Always use the same Python interpreter that is running this script
PYTHON_PATH = sys.executable

# Sync script is in the same directory as this monitor
SYNC_SCRIPT = _HERE / "git_auto_sync.py"

NOTE_APP_KEYWORD = "scrble"

# ─── Logging ───────────────────────────────────────────────────────────────────

LOG_FILE = _HERE / "monitor.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(str(LOG_FILE), encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("monitor")


# ─── App detection ─────────────────────────────────────────────────────────────

def is_note_app_running() -> bool:
    for proc in psutil.process_iter(["name", "cmdline"]):
        try:
            name = (proc.info.get("name") or "").lower()
            cmdline = proc.info.get("cmdline") or []
            cmd = " ".join(cmdline).lower()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
        if NOTE_APP_KEYWORD in name or NOTE_APP_KEYWORD in cmd:
            return True
        # UWP host process
        if name == "applicationframehost.exe" and NOTE_APP_KEYWORD in cmd:
            return True
    return False


# ─── Main loop ─────────────────────────────────────────────────────────────────

def main():
    sync_process = None

    log.info("Waiting for Scrble Ink to launch...")
    log.info(f"Python:      {PYTHON_PATH}")
    log.info(f"Sync script: {SYNC_SCRIPT}")

    if not SYNC_SCRIPT.exists():
        log.error(f"Sync script not found: {SYNC_SCRIPT}")
        input("Press Enter to exit...")
        return

    # Windows: hide console window of child process
    _creationflags = 0
    if sys.platform == "win32":
        _creationflags = subprocess.CREATE_NO_WINDOW   # Fixed: was always 0

    while True:
        app_running = is_note_app_running()

        if app_running:
            if sync_process is None or sync_process.poll() is not None:
                if sync_process is not None:
                    log.info("Sync script stopped unexpectedly — restarting.")
                else:
                    log.info("Scrble Ink detected — starting sync script.")
                try:
                    sync_process = subprocess.Popen(
                        [PYTHON_PATH, str(SYNC_SCRIPT)],
                        shell=False,
                        cwd=str(_HERE),
                        creationflags=_creationflags,
                    )
                    log.info(f"Sync script started (PID {sync_process.pid})")
                except Exception as exc:
                    log.error(f"Failed to start sync script: {exc}")
                    sync_process = None
        else:
            if sync_process is not None and sync_process.poll() is None:
                log.info("Scrble Ink closed — stopping sync script.")
                try:
                    sync_process.terminate()
                    sync_process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    sync_process.kill()
                except Exception:
                    pass
                sync_process = None

        time.sleep(5)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log.info("Monitor shut down by user.")
    except Exception as exc:
        log.exception(f"Unexpected error: {exc}")
        input("Press Enter to exit...")

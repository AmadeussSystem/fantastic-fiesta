import os
import time
import threading
import subprocess
import traceback
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ─── Config ───────────────────────────────────────────────────────
REPO_PATH = r"C:\Users\lone\Documents\fantastic-fiesta"
GIT_COMMIT_MESSAGE = "Auto-update handwritten notes"
DEBOUNCE_DELAY = 10           # seconds after last change before sync
PERIODIC_SYNC_INTERVAL = 60   # seconds (always try a sync periodically)

# ─── State ────────────────────────────────────────────────────────
lock = threading.Lock()
timer = None
periodic_timer = None
changed_files = set()
change_detected = False


# ─── Git helper ───────────────────────────────────────────────────
def run_git(cmd, check=False):
    """
    Run a git command in REPO_PATH.
    Returns subprocess.CompletedProcess.
    """
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=REPO_PATH,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        if check and result.returncode != 0:
            print("[ERROR] Command failed:", cmd)
            if result.stderr.strip():
                print(result.stderr.strip())
        return result
    except Exception as e:
        print("[ERROR] Exception while running:", cmd)
        print("        ", e)
        return subprocess.CompletedProcess(cmd, 1, "", str(e))


def auto_resolve_conflicts():
    """
    Very simple auto conflict resolver:
    - For any files in conflict (diff-filter=U), keep OUR version.
    - Stage them.
    """
    result = run_git("git diff --name-only --diff-filter=U")
    files = [f.strip() for f in result.stdout.splitlines() if f.strip()]
    if not files:
        return
    print("[INFO] Auto-resolving", len(files), "conflict(s)")
    for f in files:
        run_git(f'git checkout --ours "{f}"')
        run_git(f'git add "{f}"')


# ─── Sync logic ───────────────────────────────────────────────────
def sync_changes():
    global change_detected, changed_files

    with lock:
        if not change_detected:
            return

        try:
            print("[INFO] Syncing changes...")

            # 1. Pull remote changes first
            pull = run_git("git pull")
            if pull.returncode != 0:
                pr

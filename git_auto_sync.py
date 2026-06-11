"""
git_auto_sync.py
Watches REPO_PATH for changes and syncs them to GitHub.
Config is read from config.json in the same directory, falling back to environment
variables, so no path is ever hardcoded.
"""

import os
import sys
import json
import time
import datetime
import threading
import subprocess
import traceback
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ─── Config ────────────────────────────────────────────────────────────────────

_HERE = Path(__file__).resolve().parent
_CONFIG_PATH = _HERE / "config.json"


def _load_config() -> dict:
    defaults = {
        "repo_path": str(_HERE),
        "debounce_delay": 10,
        "periodic_sync_interval": 60,
        "commit_message_prefix": "Auto-update handwritten notes",
        "git_user_name": "",
        "git_user_email": "",
    }
    if _CONFIG_PATH.exists():
        with open(_CONFIG_PATH, "r", encoding="utf-8") as f:
            overrides = json.load(f)
        # Only update with non-comment keys that have real values
        for k, v in overrides.items():
            if not k.startswith("_") and v != "":
                defaults[k] = v
    # Allow env-var overrides
    defaults["repo_path"] = os.environ.get("SCRBLE_REPO_PATH", defaults["repo_path"])
    return defaults


CFG = _load_config()
REPO_PATH = Path(CFG["repo_path"]).expanduser().resolve()
DEBOUNCE_DELAY = int(CFG["debounce_delay"])
PERIODIC_SYNC_INTERVAL = int(CFG["periodic_sync_interval"])
COMMIT_MESSAGE_PREFIX = CFG["commit_message_prefix"]

# ─── State ─────────────────────────────────────────────────────────────────────

_lock = threading.Lock()
_debounce_timer = None
_periodic_timer = None
_changed_files: set = set()
_change_detected = False

# ─── Git helpers ───────────────────────────────────────────────────────────────


def _run_git(args: list, check: bool = False) -> subprocess.CompletedProcess:
    """
    Run a git command safely (NO shell=True) in REPO_PATH.
    `args` must be a list, e.g. ["git", "pull"].
    """
    try:
        result = subprocess.run(
            args,
            shell=False,           # NEVER shell=True — prevents command injection
            cwd=str(REPO_PATH),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        if check and result.returncode != 0:
            print(f"[ERROR] Command failed: {' '.join(args)}")
            if result.stderr.strip():
                print(f"        {result.stderr.strip()}")
        return result
    except Exception as exc:
        print(f"[ERROR] Exception running {' '.join(args)}: {exc}")
        return subprocess.CompletedProcess(args, 1, "", str(exc))


def _ensure_git_identity():
    """Check and configure git user.name / user.email if not set."""
    name = _run_git(["git", "config", "user.name"])
    email = _run_git(["git", "config", "user.email"])
    missing = []
    if not name.stdout.strip():
        missing.append("user.name")
    if not email.stdout.strip():
        missing.append("user.email")
    if missing:
        # Try to set from config.json if provided
        if CFG.get("git_user_name"):
            _run_git(["git", "config", "user.name", CFG["git_user_name"]])
            print(f"[INFO] Set git user.name from config.json")
        if CFG.get("git_user_email"):
            _run_git(["git", "config", "user.email", CFG["git_user_email"]])
            print(f"[INFO] Set git user.email from config.json")
        # Re-check after attempting to set
        name = _run_git(["git", "config", "user.name"])
        email = _run_git(["git", "config", "user.email"])
        still_missing = []
        if not name.stdout.strip():
            still_missing.append("user.name")
        if not email.stdout.strip():
            still_missing.append("user.email")
        if still_missing:
            print(f"[WARN] git config {' and '.join(still_missing)} not set. "
                  "Commits may fail. Add git_user_name/git_user_email to config.json")


def _recover_dirty_repo():
    """Clean up any in-progress merge/rebase/cherry-pick on startup."""
    git_dir = REPO_PATH / ".git"
    if (git_dir / "MERGE_HEAD").exists():
        print("[STARTUP] Repo has an in-progress merge — aborting.")
        _run_git(["git", "merge", "--abort"])
    if (git_dir / "rebase-merge").exists() or (git_dir / "rebase-apply").exists():
        print("[STARTUP] Repo has an in-progress rebase — aborting.")
        _run_git(["git", "rebase", "--abort"])
    # Reset any staged-but-not-committed changes that could block pulls
    _run_git(["git", "reset", "HEAD"])


def _auto_resolve_conflicts():
    """For conflicted files, keep OUR local version (the Scrble Ink notes win)."""
    result = _run_git(["git", "diff", "--name-only", "--diff-filter=U"])
    files = [f.strip() for f in result.stdout.splitlines() if f.strip()]
    if not files:
        return
    print(f"[INFO] Auto-resolving {len(files)} conflict(s) — keeping local version")
    for f in files:
        _run_git(["git", "checkout", "--ours", "--", f])
        _run_git(["git", "add", "--", f])


# ─── Sync logic ────────────────────────────────────────────────────────────────

def _sync_changes():
    global _change_detected, _changed_files

    with _lock:
        if not _change_detected:
            return
        # Snapshot the files to sync — only clear after successful push
        files_to_sync = set(_changed_files)

    push_succeeded = False
    try:
        print("[INFO] Syncing changes...")

        # 1. Pull remote changes (using rebase to keep history clean)
        pull = _run_git(["git", "pull", "--rebase"])
        if pull.returncode != 0:
            print("[WARN] 'git pull --rebase' failed. Attempting safe fallback.")
            _run_git(["git", "rebase", "--abort"])
            # Stash local changes, pull, then re-apply
            _run_git(["git", "stash", "push", "-m", "scrble-autosync-stash"])
            pull2 = _run_git(["git", "pull"])
            if pull2.returncode != 0:
                print("[ERROR] Pull failed even after stash. Skipping this cycle.")
                _run_git(["git", "stash", "pop"])  # restore local changes
                return
            pop = _run_git(["git", "stash", "pop"])
            if pop.returncode != 0:
                print("[WARN] Stash pop had conflicts — auto-resolving.")
                _auto_resolve_conflicts()

        # 2. Resolve any remaining merge conflicts
        _auto_resolve_conflicts()

        # 3. Stage changed / deleted files
        for rel_path in files_to_sync:
            full_path = REPO_PATH / rel_path
            if full_path.exists():
                _run_git(["git", "add", "--", rel_path])
            else:
                _run_git(["git", "rm", "--cached", "--force", "--", rel_path])

        # 4. Also stage any other modified tracked files (belt-and-suspenders)
        _run_git(["git", "add", "-u"])

        # 5. Check for staged changes
        diff = _run_git(["git", "diff", "--cached", "--quiet"])
        if diff.returncode != 0:
            # Build a descriptive commit message
            n = len(files_to_sync)
            ts = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
            msg = f"{COMMIT_MESSAGE_PREFIX}: {n} file(s) — {ts}"
            commit = _run_git(["git", "commit", "-m", msg])
            if commit.returncode != 0:
                print(f"[ERROR] Commit failed: {commit.stderr.strip()}")
                return

            push = _run_git(["git", "push"])
            if push.returncode == 0:
                print(f"[INFO] ✓ Pushed {n} file(s): {ts}")
                push_succeeded = True
            else:
                print(f"[ERROR] 'git push' failed: {push.stderr.strip()}")
                # Undo the commit so it retries next cycle
                _run_git(["git", "reset", "--soft", "HEAD~1"])
        else:
            print("[INFO] No new changes to commit.")
            push_succeeded = True  # Nothing to do = success

    except Exception:
        print("[ERROR] Exception during sync:")
        traceback.print_exc()
    finally:
        with _lock:
            if push_succeeded:
                # Only clear the files we successfully synced
                _changed_files -= files_to_sync
                if not _changed_files:
                    _change_detected = False
            # If push failed, _changed_files is preserved for the next cycle


# ─── Debouncer & periodic sync ─────────────────────────────────────────────────

def _debounce_sync():
    global _debounce_timer
    if _debounce_timer:
        _debounce_timer.cancel()
    _debounce_timer = threading.Timer(DEBOUNCE_DELAY, _sync_changes)
    _debounce_timer.daemon = True
    _debounce_timer.start()


def _periodic_sync():
    """
    Periodic sync only triggers if changes have been detected since the last cycle.
    Does NOT force change_detected=True to avoid spurious commits.
    """
    global _periodic_timer
    with _lock:
        has_changes = _change_detected
    if has_changes:
        _debounce_sync()
    _periodic_timer = threading.Timer(PERIODIC_SYNC_INTERVAL, _periodic_sync)
    _periodic_timer.daemon = True
    _periodic_timer.start()


# ─── Watchdog handler ──────────────────────────────────────────────────────────

_IGNORE_PATTERNS = {".git", ".vscode", "monitor.log", "__pycache__", "node_modules"}


class GitHandler(FileSystemEventHandler):
    def _should_ignore(self, path: str) -> bool:
        return any(p in path for p in _IGNORE_PATTERNS)

    def _handle(self, src_path: str, event_type: str):
        global _change_detected
        if self._should_ignore(src_path):
            return
        try:
            rel = str(Path(src_path).relative_to(REPO_PATH))
        except ValueError:
            return
        with _lock:
            _changed_files.add(rel)
            _change_detected = True
        print(f"[EVENT] {event_type}: {rel}")
        _debounce_sync()

    def on_modified(self, event):
        if not event.is_directory:
            self._handle(event.src_path, "modified")

    def on_created(self, event):
        if not event.is_directory:
            self._handle(event.src_path, "created")

    def on_deleted(self, event):
        if not event.is_directory:
            self._handle(event.src_path, "deleted")


# ─── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not (REPO_PATH / ".git").is_dir():
        print(f"[ERROR] Not a git repo: {REPO_PATH}")
        print("        Run 'git init' and add a remote first, or check config.json.")
        sys.exit(1)

    _ensure_git_identity()
    _recover_dirty_repo()

    print(f"[INFO] Watching: {REPO_PATH}")
    print(f"[INFO] Debounce: {DEBOUNCE_DELAY}s  |  Periodic check: {PERIODIC_SYNC_INTERVAL}s")

    handler = GitHandler()
    observer = Observer()
    observer.schedule(handler, path=str(REPO_PATH), recursive=True)
    observer.start()
    _periodic_sync()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("[INFO] Shutting down watcher...")
    finally:
        observer.stop()
        observer.join()
        if _debounce_timer:
            _debounce_timer.cancel()
        if _periodic_timer:
            _periodic_timer.cancel()

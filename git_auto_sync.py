import os
import time
import threading
import subprocess
import traceback
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ─── Config ───────────────────────────────────────────────────────
REPO_PATH = r"C:\Users\FSOS\Documents\fantastic-fiesta"
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
                print("[WARN] 'git pull' failed. Trying to reset to origin/main.")
                # Best-effort cleanup, ignore failures
                run_git("git merge --abort")
                run_git("git fetch --all")
                run_git("git reset --hard origin/main")

            # 2. Try auto-resolve if there are merge conflicts
            auto_resolve_conflicts()

            # 3. Stage tracked changes
            for rel_path in list(changed_files):
                full_path = os.path.join(REPO_PATH, rel_path)
                if os.path.exists(full_path):
                    run_git(f'git add "{rel_path}"')
                else:
                    # file was deleted
                    run_git(f'git rm --cached "{rel_path}"')

            # 4. If there are staged changes, commit and push
            diff = run_git("git diff --cached --quiet")
            if diff.returncode != 0:
                run_git(f'git commit -m "{GIT_COMMIT_MESSAGE}"')
                push = run_git("git push")
                if push.returncode == 0:
                    print("[INFO] Changes committed and pushed.")
                else:
                    print("[ERROR] 'git push' failed.")
                    if push.stderr.strip():
                        print(push.stderr.strip())
            else:
                print("[INFO] No new changes to commit.")
        except Exception:
            print("[ERROR] Exception during sync:")
            traceback.print_exc()
        finally:
            changed_files.clear()
            change_detected = False


# ─── Debouncer & periodic sync ────────────────────────────────────
def debounce_sync():
    """
    Debounce sync so we only run it once DEBOUNCE_DELAY seconds
    after the last change.
    """
    global timer
    if timer:
        timer.cancel()
    timer = threading.Timer(DEBOUNCE_DELAY, sync_changes)
    timer.daemon = True
    timer.start()


def periodic_sync():
    """
    Always try a sync every PERIODIC_SYNC_INTERVAL seconds,
    even if no file system event happened (to catch remote-only changes).
    """
    global periodic_timer, change_detected
    with lock:
        change_detected = True
    debounce_sync()

    periodic_timer = threading.Timer(PERIODIC_SYNC_INTERVAL, periodic_sync)
    periodic_timer.daemon = True
    periodic_timer.start()


# ─── Watchdog handler ─────────────────────────────────────────────
class GitHandler(FileSystemEventHandler):
    def _handle(self, src_path, event_type):
        global change_detected

        # Skip .git directory and other system files
        if ".git" in src_path or ".vscode" in src_path or "monitor.log" in src_path:
            return

        rel = os.path.relpath(src_path, REPO_PATH)
        with lock:
            changed_files.add(rel)
            change_detected = True

        print(f"[EVENT] {event_type}: {rel}")
        debounce_sync()

    def on_modified(self, event):
        if event.is_directory:
            return
        self._handle(event.src_path, "modified")

    def on_created(self, event):
        if event.is_directory:
            return
        self._handle(event.src_path, "created")

    def on_deleted(self, event):
        if event.is_directory:
            return
        self._handle(event.src_path, "deleted")


# ─── Main ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    if not os.path.isdir(os.path.join(REPO_PATH, ".git")):
        print("Not a git repository. Run 'git init' and set a remote first.")
        raise SystemExit(1)

    print("[INFO] Watching notes in:", REPO_PATH)

    handler = GitHandler()
    observer = Observer()
    observer.schedule(handler, path=REPO_PATH, recursive=True)
    observer.start()

    periodic_sync()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("[INFO] Shutting down watcher...")
        observer.stop()
    observer.join()
    if timer:
        timer.cancel()
    if periodic_timer:
        periodic_timer.cancel()

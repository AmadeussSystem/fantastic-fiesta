# import os
# import time
# import threading
# from watchdog.observers import Observer
# from watchdog.events import FileSystemEventHandler
# import subprocess

# REPO_PATH = r"C:\Users\lone\Documents\fantastic-fiesta"
# GIT_COMMIT_MESSAGE = "Auto-update handwritten notes"
# DEBOUNCE_DELAY = 10  # seconds

# lock = threading.Lock()
# timer = None
# changed_files = set()
# change_detected = False

# def run_git_command(cmd, check=False):
#     result = subprocess.run(cmd, shell=True, cwd=REPO_PATH,
#                             stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
#     if check and result.returncode != 0:
#         print(f"[ERROR] Command failed: {cmd}\n{result.stderr}")
#     return result

# def sync_changes():
#     global change_detected
#     with lock:
#         if not change_detected:
#             return

#         print("[INFO] Syncing changes...")
#         run_git_command("git fetch", check=True)

#         # Try pull and check for conflict
#         pull = run_git_command("git pull --rebase")
#         if "CONFLICT" in pull.stdout or "CONFLICT" in pull.stderr:
#             print("⚠️ Merge conflict detected! Resolve it manually before sync can continue.")
#             return

#         for file in changed_files:
#             if os.path.exists(os.path.join(REPO_PATH, file)):
#                 run_git_command(f'git add "{file}"')

#         changed_files.clear()

#         # Only commit if there are staged changes
#         diff = run_git_command("git diff --cached --quiet")
#         if diff.returncode != 0:
#             run_git_command(f'git commit -m "{GIT_COMMIT_MESSAGE}"')
#             run_git_command("git push")
#             print("[✅] Changes committed and pushed.")
#         else:
#             print("[INFO] No new changes to commit.")

#         change_detected = False

# def debounce_sync():
#     global timer
#     if timer:
#         timer.cancel()
#     timer = threading.Timer(DEBOUNCE_DELAY, sync_changes)
#     timer.daemon = True
#     timer.start()

# class GitHandler(FileSystemEventHandler):
#     def on_modified(self, event):
#         global change_detected
#         if event.is_directory:
#             return
#         rel_path = os.path.relpath(event.src_path, REPO_PATH)
#         with lock:
#             changed_files.add(rel_path)
#             change_detected = True
#         debounce_sync()

#     def on_created(self, event):
#         self.on_modified(event)

#     def on_deleted(self, event):
#         global change_detected
#         if event.is_directory:
#             return
#         rel_path = os.path.relpath(event.src_path, REPO_PATH)
#         with lock:
#             changed_files.add(rel_path)
#             change_detected = True
#         debounce_sync()

# if __name__ == "__main__":
#     if not os.path.exists(os.path.join(REPO_PATH, ".git")):
#         print("❌ Not a git repository. Run git init and set up a remote first.")
#         exit(1)

#     print(f"📡 Watching handwritten notes in: {REPO_PATH}")
#     event_handler = GitHandler()
#     observer = Observer()
#     observer.schedule(event_handler, path=REPO_PATH, recursive=True)
#     observer.start()

#     try:
#         while True:
#             time.sleep(1)
#     except KeyboardInterrupt:
#         observer.stop()
#     observer.join()
#     if timer:
#         timer.cancel()


import os, time, threading, subprocess, traceback
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ─── Config ───────────────────────────────────────────────────────
REPO_PATH          = r"C:\Users\lone\Documents\fantastic-fiesta"
GIT_COMMIT_MESSAGE = "Auto-update handwritten notes"
DEBOUNCE_DELAY     = 10  # seconds
PERIODIC_SYNC_INTERVAL = 60  # seconds

# ─── State ────────────────────────────────────────────────────────
lock            = threading.Lock()
timer           = None
periodic_timer  = None
changed_files   = set()
change_detected = False

# ─── Git Helper ───────────────────────────────────────────────────
def run_git(cmd, check=False):
    try:
        r = subprocess.run(cmd, shell=True, cwd=REPO_PATH,
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if check and r.returncode != 0:
            print(f"[ERROR] `{cmd}` failed:\n{r.stderr.strip()}")
        return r
    except Exception as e:
        print(f"[EXCEPTION] running `{cmd}`:\n{e}")
        return subprocess.CompletedProcess(cmd, 1, "", str(e))

# ─── Conflict Resolver ────────────────────────────────────────────
def auto_resolve_conflicts():
    r = run_git("git diff --name-only --diff-filter=U")
    files = [f.strip() for f in r.stdout.splitlines() if f.strip()]
    if not files:
        return
    print(f"[INFO] Auto‑resolving {len(files)} conflict(s)…")
    for f in files:
        run_git(f'git checkout --ours "{f}"')
        run_git(f'git add "{f}"')

# ─── Sync Logic ───────────────────────────────────────────────────
def sync_changes():
    global change_detected
    with lock:
        if not change_detected:
            return
        try:
            print("[INFO] Syncing changes…")

            # 1. Pull remote changes first
            pull = run_git("git pull")
            if pull.returncode != 0:
                print("[WARN] Pull failed—trying merge fallback.")
                run_git("git merge --abort")  # just in case
                run_git("git fetch --all")
                run_git("git reset --hard origin/main")

            # 2. Auto-resolve merge conflicts if any
            auto_resolve_conflicts()

            # 3. Stage only changed files that still exist
            for f in list(changed_files):
                full_path = os.path.join(REPO_PATH, f)
                if os.path.exists(full_path):
                    run_git(f'git add "{f}"')
                else:
                    run_git(f'git rm --cached "{f}"')  # file was deleted

            # 4. Commit and push if there's anything staged
            diff = run_git("git diff --cached --quiet")
            if diff.returncode != 0:
                run_git(f'git commit -m "{GIT_COMMIT_MESSAGE}"')
                push = run_git("git push")
                if push.returncode == 0:
                    print("[✅] Changes committed & pushed.")
                else:
                    print("[ERROR] Push failed:\n" + push.stderr.strip())
            else:
                print("[INFO] No new changes to commit.")
        except Exception:
            print("[EXCEPTION] during sync:")
            traceback.print_exc()
        finally:
            changed_files.clear()
            change_detected = False

# ─── Debouncer ────────────────────────────────────────────────────
def debounce_sync():
    global timer
    if timer:
        timer.cancel()
    timer = threading.Timer(DEBOUNCE_DELAY, sync_changes)
    timer.daemon = True
    timer.start()

def periodic_sync():
    # Always try to sync, even if no local change detected
    global change_detected
    with lock:
        change_detected = True
    debounce_sync()
    # Reschedule itself
    global periodic_timer
    periodic_timer = threading.Timer(PERIODIC_SYNC_INTERVAL, periodic_sync)
    periodic_timer.daemon = True
    periodic_timer.start()

# ─── Watchdog Handler ─────────────────────────────────────────────
class GitHandler(FileSystemEventHandler):
    def on_modified(self, event):
        global change_detected
        if event.is_directory or ".git" in event.src_path:
            return
        rel = os.path.relpath(event.src_path, REPO_PATH)
        with lock:
            changed_files.add(rel)
            change_detected = True
        print(f"[EVENT] Modified: {rel}")
        debounce_sync()

    def on_created(self, event):
        if event.is_directory or ".git" in event.src_path:
            return
        self.on_modified(event)

    def on_deleted(self, event):
        global change_detected
        if event.is_directory or ".git" in event.src_path:
            return
        rel = os.path.relpath(event.src_path, REPO_PATH)
        with lock:
            changed_files.add(rel)
            change_detected = True
        print(f"[EVENT] Deleted: {rel}")
        debounce_sync()

# ─── Main ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    if not os.path.isdir(os.path.join(REPO_PATH, ".git")):
        print("❌ Not a git repo—run `git init` & set a remote first.")
        exit(1)

    print(f"📡 Watching handwritten notes in {REPO_PATH}")
    handler = GitHandler()
    observer = Observer()
    observer.schedule(handler, path=REPO_PATH, recursive=True)
    observer.start()

    # Start periodic sync
    periodic_sync()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
    if timer:
        timer.cancel()
    if periodic_timer:
        periodic_timer.cancel()
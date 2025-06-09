
import os
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

REPO_PATH = r"C:\Users\lone\Documents\Notes"
GIT_COMMIT_MESSAGE = "Auto-update notes"

class GitHandler(FileSystemEventHandler):
    def on_any_event(self, event):
        os.chdir(REPO_PATH)
        os.system("git add .")
        os.system(f'git commit -m "{GIT_COMMIT_MESSAGE}"')
        os.system("git push")

if __name__ == "__main__":
    event_handler = GitHandler()
    observer = Observer()
    observer.schedule(event_handler, path=REPO_PATH, recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(10)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
import os
import time
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

REPO_PATH = r"C:\Users\lone\Documents\Notes"
GIT_COMMIT_MESSAGE = "Auto-update notes"
DEBOUNCE_DELAY = 10  # seconds

change_detected = False
lock = threading.Lock()
timer = None

def sync_changes():
    global change_detected
    with lock:
        if change_detected:
            os.chdir(REPO_PATH)
            os.system("git add .")
            # Only commit if there are staged changes
            if os.system("git diff --cached --quiet") != 0:
                os.system(f'git commit -m "{GIT_COMMIT_MESSAGE}"')
                os.system("git push")
            change_detected = False

def debounce_sync():
    global timer
    if timer:
        timer.cancel()
    timer = threading.Timer(DEBOUNCE_DELAY, sync_changes)
    timer.start()

class GitHandler(FileSystemEventHandler):
    def on_any_event(self, event):
        global change_detected
        with lock:
            change_detected = True
        debounce_sync()

if __name__ == "__main__":
    os.chdir(REPO_PATH)
    if not os.path.exists(os.path.join(REPO_PATH, ".git")):
        print("Not a git repository. Run git init and set up a remote first.")
        exit(1)

    event_handler = GitHandler()
    observer = Observer()
    observer.schedule(event_handler, path=REPO_PATH, recursive=True)
    observer.start()

    print(f"Watching changes in {REPO_PATH}... Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
    if timer:
        timer.cancel()

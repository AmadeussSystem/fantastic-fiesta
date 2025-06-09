
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

// ─── GitHub Configuration ──────────────────────────────────────────────────────
// Change these values if you fork/clone this repo under a different account.

export const GITHUB_CONFIG = {
  owner: "AmadeussSystem",      // ← change to your GitHub username
  repo: "fantastic-fiesta",     // ← change to your repo name
  branch: "main",
  notesFolder: "Scribble",      // folder inside repo where Scrble saves files
};

/**
 * Build the GitHub API URL for a given repo path.
 * Used to list directory contents via the GitHub Contents API.
 */
export const apiUrl = (path: string) =>
  `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;

/**
 * Build the raw content URL for a given repo path.
 * Used to fetch images, code files, etc. directly.
 */
export const rawUrl = (path: string) =>
  `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${path}`;

/**
 * Build the GitHub repo URL (for linking to the repo page).
 */
export const repoUrl = () =>
  `https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`;

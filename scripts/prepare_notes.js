const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const FRONTEND_PUBLIC = path.join(PROJECT_ROOT, 'frontend', 'public');

// Check for GitHub Actions checkout path first (from deploy.yml), then local path
const OBSIDIAN_SOURCE = process.env.OBSIDIAN_PATH ||
    (fs.existsSync(path.join(PROJECT_ROOT, 'obsidian-vault'))
        ? path.join(PROJECT_ROOT, 'obsidian-vault')
        : String.raw`C:\Users\FSOS\Documents\GitHub\Obsidian-vault`);
const SCRIBBLE_SOURCE = process.env.SCRIBBLE_PATH || path.join(PROJECT_ROOT, 'Scribble');

const OBSIDIAN_DEST = path.join(FRONTEND_PUBLIC, 'obsidian');
const SCRIBBLE_DEST = path.join(FRONTEND_PUBLIC, 'scribble');
const CATALOG_FILE = path.join(FRONTEND_PUBLIC, 'catalog.json');

// CSS Snippets paths
const OBSIDIAN_SNIPPETS_SOURCE = path.join(OBSIDIAN_SOURCE, '.obsidian', 'snippets');
const CSS_SNIPPETS_DEST = path.join(PROJECT_ROOT, 'frontend', 'src', 'styles', 'obsidian-snippets');

async function cleanAndCopy(source, dest) {
    if (fs.existsSync(dest)) {
        console.log(`Cleaning ${dest}...`);
        await rm(dest, { recursive: true, force: true });
    }

    if (!fs.existsSync(source)) {
        console.log(`Warning: Source ${source} does not exist. Skipping.`);
        return;
    }

    console.log(`Copying from ${source} to ${dest}...`);
    await copyDir(source, dest);
}

// Sanitize folder/file names for web compatibility
function sanitizeName(name) {
    return name
        .replace(/&/g, 'and')  // Replace & with 'and'
        .replace(/#/g, '-')     // Replace # with -
        .replace(/[<>:"|?*]/g, '_'); // Replace other invalid chars
}

// Sanitize markdown frontmatter - fixes duplicate frontmatter blocks
async function sanitizeFrontmatter(content) {
    // Match all frontmatter blocks (--- ... ---)
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/gm;
    const matches = [];
    let match;

    // Find all frontmatter blocks
    while ((match = frontmatterRegex.exec(content)) !== null) {
        matches.push({
            fullMatch: match[0],
            yamlContent: match[1],
            index: match.index
        });
    }

    // If no frontmatter or only one block, return as-is
    if (matches.length <= 1) {
        return content;
    }

    console.log(`  ⚠ Found ${matches.length} frontmatter blocks, merging...`);

    // Keep the last frontmatter block (usually most complete)
    const lastFrontmatter = matches[matches.length - 1];

    // Remove all frontmatter blocks from content
    let cleanedContent = content;
    for (let i = matches.length - 1; i >= 0; i--) {
        const startIndex = matches[i].index;
        const endIndex = startIndex + matches[i].fullMatch.length;
        cleanedContent = cleanedContent.slice(0, startIndex) + cleanedContent.slice(endIndex);
    }

    // Add back the last frontmatter at the beginning
    return lastFrontmatter.fullMatch + cleanedContent;
}


async function copyDir(src, dest) {
    await mkdir(dest, { recursive: true });

    const entries = await readdir(src, { withFileTypes: true });

    for (let entry of entries) {
        // Skip hidden files/dirs and .git
        if (entry.name.startsWith('.') || entry.name === '.git') continue;

        const srcPath = path.join(src, entry.name);
        // Sanitize the destination name
        const sanitizedName = sanitizeName(entry.name);
        const destPath = path.join(dest, sanitizedName);

        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else if (entry.name.endsWith('.md')) {
            // For markdown files, sanitize frontmatter
            const content = await readFile(srcPath, 'utf-8');
            const sanitized = await sanitizeFrontmatter(content);
            await writeFile(destPath, sanitized, 'utf-8');
        } else {
            // For other files, just copy
            await copyFile(srcPath, destPath);
        }
    }
}

async function generateCatalog(basePath, relativeRoot) {
    const catalog = [];
    if (!fs.existsSync(basePath)) return catalog;

    async function walk(currentPath, relPath) {
        const entries = await readdir(currentPath, { withFileTypes: true });

        for (let entry of entries) {
            if (entry.name.startsWith('.')) continue;

            const fullPath = path.join(currentPath, entry.name);
            const nextRelPath = path.join(relPath, entry.name);

            if (entry.isDirectory()) {
                await walk(fullPath, nextRelPath);
            } else {
                // Web-accessible path (force forward slashes) - relative path for Vite base support
                const webPath = `${relativeRoot}/${nextRelPath}`.replace(/\\/g, '/');

                // Determine parent folder for filtering
                const parentDir = path.dirname(nextRelPath).replace(/\\/g, '/');
                const parent = parentDir === '.' ? '' : parentDir;

                catalog.push({
                    name: entry.name,
                    path: webPath,
                    type: 'file',
                    source: relativeRoot,
                    parent: parent
                });
            }
        }
    }

    await walk(basePath, '');
    return catalog;
}

// Copy CSS snippets from Obsidian vault
async function copyCssSnippets() {
    if (!fs.existsSync(OBSIDIAN_SNIPPETS_SOURCE)) {
        console.log('No CSS snippets folder found in Obsidian vault. Skipping...');
        return;
    }

    // Create destination folder
    await mkdir(CSS_SNIPPETS_DEST, { recursive: true });

    console.log(`Copying CSS snippets from ${OBSIDIAN_SNIPPETS_SOURCE}...`);

    const snippets = await readdir(OBSIDIAN_SNIPPETS_SOURCE);
    let copiedCount = 0;

    for (const file of snippets) {
        if (file.endsWith('.css')) {
            const srcPath = path.join(OBSIDIAN_SNIPPETS_SOURCE, file);
            const destPath = path.join(CSS_SNIPPETS_DEST, file);
            await copyFile(srcPath, destPath);
            copiedCount++;
        }
    }

    // Create an index file that imports all snippets
    const indexContent = snippets
        .filter(f => f.endsWith('.css'))
        .map(f => `@import "./${f}";`)  // Use double quotes to avoid issues with single quotes in filenames
        .join('\n');

    fs.writeFileSync(path.join(CSS_SNIPPETS_DEST, 'index.css'), indexContent);

    console.log(`✓ Copied ${copiedCount} CSS snippet(s)`);
}

async function main() {
    console.log("--- Starting Note Sync (Node.js) ---");

    try {
        // 1. Copy Obsidian Notes
        await cleanAndCopy(OBSIDIAN_SOURCE, OBSIDIAN_DEST);

        // 2. Copy Scribble Notes
        await cleanAndCopy(SCRIBBLE_SOURCE, SCRIBBLE_DEST);

        // 2.5. Copy CSS Snippets from Obsidian
        await copyCssSnippets();

        // 3. Generate Catalog
        console.log("Generating catalog...");
        const obsidianItems = await generateCatalog(OBSIDIAN_DEST, "obsidian");
        const scribbleItems = await generateCatalog(SCRIBBLE_DEST, "scribble");

        const fullCatalog = {
            obsidian: obsidianItems,
            scribble: scribbleItems
        };

        fs.writeFileSync(CATALOG_FILE, JSON.stringify(fullCatalog, null, 2));

        console.log(`Catalog written to ${CATALOG_FILE}`);
        console.log("--- Done ---");
    } catch (err) {
        console.error("Error during sync:", err);
        process.exit(1);
    }
}

main();

const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

// Configuration - same as prepare_notes.js
const OBSIDIAN_SOURCE = process.env.OBSIDIAN_PATH || String.raw`C:\Users\FSOS\Documents\GitHub\Obsidian-Vault-Template\Vault`;
const SCRIBBLE_SOURCE = process.env.SCRIBBLE_PATH || path.join(__dirname, '..', 'Scribble');

let isRunning = false;
let shouldRunAgain = false;

function runPrepareNotes() {
    if (isRunning) {
        shouldRunAgain = true;
        console.log('📝 Changes detected while syncing. Will run again after completion.');
        return;
    }

    isRunning = true;
    shouldRunAgain = false;
    console.log('\n🔄 Changes detected! Syncing notes...');

    exec('node ../scripts/prepare_notes.js', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Error during sync:', error);
        } else {
            console.log(stdout);
            console.log('✅ Sync complete! Watching for changes...\n');
        }

        isRunning = false;

        if (shouldRunAgain) {
            setTimeout(runPrepareNotes, 500);
        }
    });
}

console.log('👀 Watching for file changes...');
console.log(`   Obsidian: ${OBSIDIAN_SOURCE}`);
console.log(`   Scribble: ${SCRIBBLE_SOURCE}`);
console.log('\n✨ Make changes to your notes - they will sync automatically!\n');

// Watch both directories
const watcher = chokidar.watch([OBSIDIAN_SOURCE, SCRIBBLE_SOURCE], {
    ignored: [
        /(^|[\/\\])\../,  // Ignore dotfiles
        /\.git/,          // Ignore git
        /node_modules/    // Ignore node_modules
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
    }
});

watcher
    .on('add', path => {
        console.log(`➕ File added: ${path}`);
        runPrepareNotes();
    })
    .on('change', path => {
        console.log(`📝 File changed: ${path}`);
        runPrepareNotes();
    })
    .on('unlink', path => {
        console.log(`➖ File removed: ${path}`);
        runPrepareNotes();
    })
    .on('error', error => console.error('❌ Watcher error:', error));

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Stopping file watcher...');
    watcher.close();
    process.exit();
});

/**
 * Watch all RMMZ plugins and auto-rebuild + deploy on changes
 *
 * This script:
 * - Watches all plugin source directories
 * - Rebuilds plugins when files change
 * - Auto-deploys to RMMZ project
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const RMMZ_PROJECT = path.join(__dirname, '../../rmmz/Project1/js/plugins');

// Find all plugin directories (those with package.json and src/ directory)
function findPlugins() {
  const plugins = [];
  const entries = fs.readdirSync(__dirname, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pluginDir = path.join(__dirname, entry.name);
    const packageJsonPath = path.join(pluginDir, 'package.json');
    const srcPath = path.join(pluginDir, 'src');

    if (fs.existsSync(packageJsonPath) && fs.existsSync(srcPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        plugins.push({
          name: entry.name,
          displayName: pkg.name || entry.name,
          dir: pluginDir,
          hasWatchScript: pkg.scripts && pkg.scripts.watch
        });
      } catch (error) {
        console.warn(`⚠️  Failed to read ${entry.name}/package.json`);
      }
    }
  }

  return plugins;
}

// Main
console.log('🔍 Discovering plugins...\n');

const plugins = findPlugins();

if (plugins.length === 0) {
  console.log('❌ No plugins found in', __dirname);
  process.exit(1);
}

console.log(`Found ${plugins.length} plugin(s):\n`);
plugins.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.displayName} (${p.name})`);
});

console.log(`\n📍 Deploy target: ${RMMZ_PROJECT}\n`);

if (!fs.existsSync(RMMZ_PROJECT)) {
  console.log(`⚠️  Warning: RMMZ project not found at ${RMMZ_PROJECT}`);
  console.log('   Plugins will build but not deploy.\n');
}

console.log('🚀 Starting watch mode for all plugins...\n');
console.log('─'.repeat(60) + '\n');

const watchers = [];

// Start watch process for each plugin
for (const plugin of plugins) {
  if (!plugin.hasWatchScript) {
    console.log(`⚠️  ${plugin.displayName}: No watch script found, skipping`);
    continue;
  }

  console.log(`▶️  Starting ${plugin.displayName}...`);

  const proc = spawn('npm', ['run', 'watch'], {
    cwd: plugin.dir,
    stdio: 'inherit',
    shell: true
  });

  proc.on('error', (error) => {
    console.error(`❌ ${plugin.displayName} error:`, error.message);
  });

  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`\n⚠️  ${plugin.displayName} exited with code ${code}`);
    }
  });

  watchers.push({ name: plugin.displayName, proc });
}

console.log('\n' + '─'.repeat(60));
console.log('\n✨ All watchers started! Press Ctrl+C to stop all.\n');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping all watchers...\n');

  watchers.forEach(({ name, proc }) => {
    console.log(`  ⏹️  Stopping ${name}...`);
    proc.kill('SIGINT');
  });

  setTimeout(() => {
    console.log('\n👋 All watchers stopped.\n');
    process.exit(0);
  }, 1000);
});

// Keep process alive
process.stdin.resume();

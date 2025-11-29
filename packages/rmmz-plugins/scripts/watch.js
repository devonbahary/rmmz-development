#!/usr/bin/env node

/**
 * Shared watch script for RMMZ plugins
 *
 * Automatically detects plugin name and watches it.
 * Usage: node ../scripts/watch.js (run from plugin directory)
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Determine plugin directory (where this script was called from)
const pluginDir = process.cwd();
const pluginName = path.basename(pluginDir);

// Read package.json to get output filename
const pkg = JSON.parse(fs.readFileSync(path.join(pluginDir, 'package.json'), 'utf8'));
const outputFileName = path.basename(pkg.main || `dist/${pluginName}.js`);

// Read RMMZ plugin header
const headerPath = path.join(pluginDir, 'plugin-header.js');
const header = fs.readFileSync(headerPath, 'utf8').trim();

// Deploy configuration
const RMMZ_PROJECT_PATH = path.join(pluginDir, '../../../rmmz/Project1/js/plugins');
const deployPath = path.join(RMMZ_PROJECT_PATH, outputFileName);

console.log(`👀 Watching ${pluginName} plugin for changes...\n`);
console.log(`📦 Output: dist/${outputFileName}`);
console.log(`🚀 Deploy: ${deployPath}\n`);

// Build configuration
const buildConfig = {
  entryPoints: [path.join(pluginDir, 'src/index.js')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2015',              // RMMZ compatible
  outfile: path.join(pluginDir, 'dist', outputFileName),
  minify: false,
  keepNames: true,
  banner: {
    js: header
  },
  external: [],
  mainFields: ['module', 'main'],
};

// Deploy function
function deploy() {
  const sourcePath = path.join(pluginDir, 'dist', outputFileName);

  // Check if RMMZ project exists
  if (!fs.existsSync(RMMZ_PROJECT_PATH)) {
    console.log(`⚠️  RMMZ project not found: ${RMMZ_PROJECT_PATH}`);
    console.log('   Skipping deploy...\n');
    return;
  }

  // Copy to RMMZ project
  try {
    fs.copyFileSync(sourcePath, deployPath);
    const stats = fs.statSync(deployPath);
    console.log(`✓ Deployed to RMMZ (${(stats.size / 1024).toFixed(1)} KB)`);
  } catch (error) {
    console.error(`✗ Deploy failed: ${error.message}`);
  }
}

// Create context for watch mode
esbuild.context(buildConfig).then(ctx => {
  // Watch for changes
  ctx.watch();

  // Rebuild handler
  console.log('Performing initial build...\n');

  ctx.rebuild().then(() => {
    const stats = fs.statSync(buildConfig.outfile);
    console.log(`✓ Initial build complete (${(stats.size / 1024).toFixed(1)} KB)`);
    deploy();
    console.log('\n👀 Watching for changes... (Press Ctrl+C to stop)\n');
  }).catch(error => {
    console.error('✗ Initial build failed:', error);
  });

  // Handle file changes
  const srcDir = path.join(pluginDir, 'src');
  let rebuildTimeout;

  // Simple file watcher to trigger deploys
  fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith('.js')) return;

    clearTimeout(rebuildTimeout);
    rebuildTimeout = setTimeout(() => {
      console.log(`\n🔄 Change detected: ${filename}`);
      ctx.rebuild().then(() => {
        const stats = fs.statSync(buildConfig.outfile);
        console.log(`✓ Rebuilt (${(stats.size / 1024).toFixed(1)} KB)`);
        deploy();
        console.log('');
      }).catch(error => {
        console.error('✗ Build failed:', error.message);
      });
    }, 100);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping watch mode...');
    ctx.dispose();
    process.exit(0);
  });
}).catch(error => {
  console.error('✗ Watch setup failed:', error);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Shared build script for RMMZ plugins
 *
 * Automatically detects plugin name and builds it.
 * Usage: node ../scripts/build.js (run from plugin directory)
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

console.log(`Building ${pluginName} plugin...\n`);

// Read RMMZ plugin header
const headerPath = path.join(pluginDir, 'plugin-header.js');
const header = fs.readFileSync(headerPath, 'utf8').trim();

// Build bundle
esbuild.build({
  entryPoints: [path.join(pluginDir, 'src/index.js')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2015',              // RMMZ compatible
  outfile: path.join(pluginDir, 'dist', outputFileName),
  minify: false,                  // Keep readable
  keepNames: true,                // Preserve function names
  banner: {
    js: header                    // Add RMMZ header
  },
  external: [],                   // Bundle everything
  mainFields: ['module', 'main'], // Prefer ESM
}).then(() => {
  console.log('✓ Plugin built successfully');
  console.log(`  Output: dist/${outputFileName}`);

  const stats = fs.statSync(path.join(pluginDir, 'dist', outputFileName));
  console.log(`  Size: ${(stats.size / 1024).toFixed(1)} KB`);
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});

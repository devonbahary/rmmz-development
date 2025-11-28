const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

console.log('Building Physick plugin...\n');

// Read RMMZ plugin header
const headerPath = path.join(__dirname, 'plugin-header.js');
const header = fs.readFileSync(headerPath, 'utf8').trim();

// Build bundle
esbuild.build({
  entryPoints: [path.join(__dirname, 'src/index.js')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2015',              // RMMZ compatible
  outfile: path.join(__dirname, 'dist/Physick.js'),
  minify: false,                  // Keep readable
  keepNames: true,                // Preserve function names
  banner: {
    js: header                    // Add RMMZ header
  },
  external: [],                   // Bundle everything
  mainFields: ['module', 'main'], // Prefer ESM
}).then(() => {
  console.log('✓ Plugin built successfully');
  console.log('  Output: dist/Physick.js');

  const stats = fs.statSync(path.join(__dirname, 'dist/Physick.js'));
  console.log(`  Size: ${(stats.size / 1024).toFixed(1)} KB`);
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});

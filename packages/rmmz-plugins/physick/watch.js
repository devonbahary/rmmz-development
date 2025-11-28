const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Read RMMZ plugin header
const headerPath = path.join(__dirname, 'plugin-header.js');
const header = fs.readFileSync(headerPath, 'utf8').trim();

// Deploy configuration
const RMMZ_PROJECT_PATH = path.join(__dirname, '../../../rmmz/Project1/js/plugins');
const PLUGIN_NAME = 'Physick.js';
const deployPath = path.join(RMMZ_PROJECT_PATH, PLUGIN_NAME);

console.log('👀 Watching Physick plugin for changes...\n');
console.log(`📦 Output: dist/${PLUGIN_NAME}`);
console.log(`🚀 Deploy: ${deployPath}\n`);

// Build configuration
const buildConfig = {
  entryPoints: [path.join(__dirname, 'src/index.js')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2015',              // RMMZ compatible
  outfile: path.join(__dirname, `dist/${PLUGIN_NAME}`),
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
  const sourcePath = path.join(__dirname, `dist/${PLUGIN_NAME}`);

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
  const srcDir = path.join(__dirname, 'src');
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

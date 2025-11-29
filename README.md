# Physics Engine & RMMZ Plugins - Development Monorepo

Development workspace for physics-engine library and RMMZ plugins.

## Packages

### [physics-engine](./packages/physics-engine)

TypeScript 2D top-down physics engine with collision detection for circles and rectangles.

### [rmmz-plugins](./packages/rmmz-plugins)

Collection of RPG Maker MZ plugins utilizing the physics-engine library.

**Plugins**

- **physick** - Incorporates the physics-engine into RMMZ.

## Development Workflow

To watch the physics-engine and plugins with automatic deploys to the RMMZ project, run:
`npm run dev`

To playtest the game in a browser, run:
`npm run serve`

## Adding New Plugins

Follow these steps to create a new plugin with full development functionality:

### 1. Create Plugin Directory Structure

```bash
cd packages/rmmz-plugins
mkdir -p new-plugin/src/{managers,scenes,sprites,windows}
cd new-plugin
```

### 2. Initialize Package

```bash
npm init -y
```

### 3. Create package.json

Replace the generated `package.json` with:

```json
{
  "name": "new-plugin",
  "version": "0.1.0",
  "description": "Your plugin description",
  "main": "dist/NewPlugin.js",
  "scripts": {
    "build": "node build.js",
    "watch": "node watch.js",
    "deploy": "npm run build && cp dist/NewPlugin.js ../../../rmmz/Project1/js/plugins/NewPlugin.js",
    "dev": "node watch.js",
    "clean": "rm -rf dist"
  },
  "keywords": ["rpg-maker", "rmmz", "plugin"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "physics-engine": "*"
  },
  "devDependencies": {
    "esbuild": "^0.27.0"
  }
}
```

**Important:** Replace `new-plugin`, `NewPlugin`, and `NewPlugin.js` with your actual plugin name.

### 4. Create Build Scripts

Create `build.js`:

```javascript
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

console.log('Building NewPlugin plugin...\n');

// Read RMMZ plugin header
const headerPath = path.join(__dirname, 'plugin-header.js');
const header = fs.readFileSync(headerPath, 'utf8').trim();

// Build bundle
esbuild
  .build({
    entryPoints: [path.join(__dirname, 'src/index.js')],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    outfile: path.join(__dirname, 'dist/NewPlugin.js'),
    minify: false,
    keepNames: true,
    banner: {
      js: header,
    },
    external: [],
    mainFields: ['module', 'main'],
  })
  .then(() => {
    console.log('✓ Plugin built successfully');
    console.log('  Output: dist/NewPlugin.js');

    const stats = fs.statSync(path.join(__dirname, 'dist/NewPlugin.js'));
    console.log(`  Size: ${(stats.size / 1024).toFixed(1)} KB`);
  })
  .catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
  });
```

Create `watch.js`:

```javascript
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Read RMMZ plugin header
const headerPath = path.join(__dirname, 'plugin-header.js');
const header = fs.readFileSync(headerPath, 'utf8').trim();

// Deploy configuration
const RMMZ_PROJECT_PATH = path.join(__dirname, '../../../rmmz/Project1/js/plugins');
const PLUGIN_NAME = 'NewPlugin.js';
const deployPath = path.join(RMMZ_PROJECT_PATH, PLUGIN_NAME);

console.log('👀 Watching NewPlugin plugin for changes...\n');
console.log(`📦 Output: dist/${PLUGIN_NAME}`);
console.log(`🚀 Deploy: ${deployPath}\n`);

// Build configuration
const buildConfig = {
  entryPoints: [path.join(__dirname, 'src/index.js')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  outfile: path.join(__dirname, `dist/${PLUGIN_NAME}`),
  minify: false,
  keepNames: true,
  banner: {
    js: header,
  },
  external: [],
  mainFields: ['module', 'main'],
};

// Deploy function
function deploy() {
  const sourcePath = path.join(__dirname, `dist/${PLUGIN_NAME}`);

  if (!fs.existsSync(RMMZ_PROJECT_PATH)) {
    console.log(`⚠️  RMMZ project not found: ${RMMZ_PROJECT_PATH}`);
    console.log('   Skipping deploy...\n');
    return;
  }

  try {
    fs.copyFileSync(sourcePath, deployPath);
    const stats = fs.statSync(deployPath);
    console.log(`✓ Deployed to RMMZ (${(stats.size / 1024).toFixed(1)} KB)`);
  } catch (error) {
    console.error(`✗ Deploy failed: ${error.message}`);
  }
}

// Create context for watch mode
esbuild
  .context(buildConfig)
  .then((ctx) => {
    ctx.watch();

    console.log('Performing initial build...\n');

    ctx
      .rebuild()
      .then(() => {
        const stats = fs.statSync(buildConfig.outfile);
        console.log(`✓ Initial build complete (${(stats.size / 1024).toFixed(1)} KB)`);
        deploy();
        console.log('\n👀 Watching for changes... (Press Ctrl+C to stop)\n');
      })
      .catch((error) => {
        console.error('✗ Initial build failed:', error);
      });

    // Handle file changes
    const srcDir = path.join(__dirname, 'src');
    let rebuildTimeout;

    fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
      if (!filename || !filename.endsWith('.js')) return;

      clearTimeout(rebuildTimeout);
      rebuildTimeout = setTimeout(() => {
        console.log(`\n🔄 Change detected: ${filename}`);
        ctx
          .rebuild()
          .then(() => {
            const stats = fs.statSync(buildConfig.outfile);
            console.log(`✓ Rebuilt (${(stats.size / 1024).toFixed(1)} KB)`);
            deploy();
            console.log('');
          })
          .catch((error) => {
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
  })
  .catch((error) => {
    console.error('✗ Watch setup failed:', error);
    process.exit(1);
  });
```

**Important:** Replace all instances of `NewPlugin` with your plugin name in both files.

### 5. Create Plugin Header

Create `plugin-header.js`:

```javascript
//=============================================================================
// NewPlugin.js
// Version: 0.1.0
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Your plugin description
 * @author Your Name
 *
 * @help NewPlugin.js
 *
 * Plugin help text goes here.
 */
```

### 6. Create Entry Point

Create `src/index.js`:

```javascript
// Import physics-engine library (if needed)
import * as CollisionDetection from 'physics-engine';

// Make available globally (required for RMMZ environment)
window.CollisionDetection = CollisionDetection;

// Get plugin parameters
window._NewPlugin_params = PluginManager.parameters('NewPlugin');

// Shared state (accessible via window for modules)
window._NewPlugin_state = {};

// Import modules (they access shared state via window)
// import './managers/YourManager.js';
// import './scenes/Scene_Map.js';
// import './sprites/Sprite_Body.js';

// Export public API
window.NewPluginAPI = {
  // Add your public API methods here
};

console.log('NewPlugin loaded');
```

### 7. Install Dependencies

From the **root** directory:

```bash
npm install
```

This will:

- Install `esbuild` as a dev dependency
- Link `physics-engine` from the monorepo workspace
- Make the plugin available to `watch-all.js`

### 8. Verify Integration

The plugin will automatically be discovered by:

- `npm run watch` (from `packages/rmmz-plugins/`) - watches all plugins
- `npm run watch` (from root) - watches physics-engine + all plugins

### 9. Development Commands

From the plugin directory:

```bash
npm run build    # Build once
npm run watch    # Watch and rebuild (no deploy)
npm run dev      # Watch, rebuild, and deploy to RMMZ
npm run deploy   # Build once and deploy to RMMZ
npm run clean    # Remove dist/ directory
```

### Customization Checklist

When creating a new plugin, remember to replace:

- [ ] Plugin name in `package.json` (name, description, main)
- [ ] Plugin name in `build.js` (console.log, outfile filename)
- [ ] Plugin name in `watch.js` (PLUGIN_NAME, console.log messages)
- [ ] Plugin name in `plugin-header.js` (filename, @plugindesc, @help)
- [ ] Plugin name in `src/index.js` (window variables, PluginManager.parameters)
- [ ] Deploy path in `watch.js` and `package.json` deploy script (if different RMMZ project)

## Notes

- **Monorepo is for development only** - never push this to a public repo
- Each package publishes to its own GitHub repository
- Plugins automatically use latest local collision-detection during development
- npm workspaces handle linking - no manual npm link needed

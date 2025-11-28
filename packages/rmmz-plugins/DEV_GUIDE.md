# RMMZ Plugin Development Guide

## Quick Start

### Development Workflow

**Watch single plugin (recommended during development):**

```bash
cd packages/rmmz-plugins/physick
npm run dev
```

This will:

- ✅ Watch for changes in `src/**/*.js`
- ✅ Rebuild automatically on save
- ✅ Deploy to RMMZ project automatically

**Watch all plugins at once:**

```bash
cd packages/rmmz-plugins
npm run dev
```

**One-time build and deploy:**

```bash
cd packages/rmmz-plugins/physick
npm run deploy
```

## Available Commands

### Per-Plugin Commands

Navigate to a specific plugin directory first:

```bash
cd packages/rmmz-plugins/physick
```

| Command          | Description                   |
| ---------------- | ----------------------------- |
| `npm run build`  | Build once to `dist/`         |
| `npm run watch`  | Watch and rebuild (no deploy) |
| `npm run dev`    | Watch, rebuild, and deploy    |
| `npm run deploy` | Build once and deploy to RMMZ |
| `npm run clean`  | Remove `dist/` directory      |

### Workspace-Level Commands

Run from `packages/rmmz-plugins/`:

| Command          | Description                  |
| ---------------- | ---------------------------- |
| `npm run build`  | Build all plugins once       |
| `npm run watch`  | Watch all plugins            |
| `npm run dev`    | Watch and deploy all plugins |
| `npm run deploy` | Build and deploy all plugins |
| `npm run clean`  | Clean all plugin builds      |

## Watch System Features

### Automatic Rebuild

When you save any file in `src/`:

```
🔄 Change detected: src/scenes/Scene_Map.js
✓ Rebuilt (32.4 KB)
✓ Deployed to RMMZ (32.4 KB)
```

### Hot Reload in RMMZ

To see changes in RMMZ without restarting:

1. Save your file (auto-rebuilds and deploys)
2. In RMMZ playtest, press **F5** to reload scripts
3. Changes take effect immediately

### Multi-Plugin Development

The watch system can monitor multiple plugins simultaneously:

```bash
# From packages/rmmz-plugins/
npm run dev
```

Output:

```
Found 2 plugin(s):

  1. physick (physick)
  2. my-other-plugin (my-other-plugin)

📍 Deploy target: /path/to/rmmz/Project1/js/plugins

🚀 Starting watch mode for all plugins...

▶️  Starting physick...
▶️  Starting my-other-plugin...

✨ All watchers started! Press Ctrl+C to stop all.
```

## Configuration

### Customize RMMZ Project Path

Edit `packages/rmmz-plugins/dev.config.js`:

```javascript
module.exports = {
  // Change this to your RMMZ project path
  rmmzPluginsPath: path.join(__dirname, '../../rmmz/Project1/js/plugins'),

  // Or use absolute path:
  // rmmzPluginsPath: '/absolute/path/to/rmmz/Project/js/plugins',
};
```

### Per-Plugin Configuration

In `dev.config.js`, customize each plugin:

```javascript
plugins: {
  physick: {
    outputName: 'Physick.js',  // Filename in RMMZ
    autoDeploy: true,           // Auto-deploy on change
  },
  'my-plugin': {
    outputName: 'MyPlugin.js',
    autoDeploy: false,          // Build only, no deploy
  },
},
```

### Watch Settings

Adjust watch behavior:

```javascript
watch: {
  debounceDelay: 100,           // Wait 100ms before rebuilding
  extensions: ['.js', '.json'], // File types to watch
  ignore: ['node_modules', 'dist'],
},
```

## Adding a New Plugin

### 1. Create Plugin Directory

```bash
cd packages/rmmz-plugins
mkdir my-plugin
cd my-plugin
```

### 2. Initialize Package

```bash
npm init -y
```

### 3. Set Up Structure

```bash
mkdir -p src/scenes src/managers src/sprites
touch src/index.js
touch plugin-header.js
```

### 4. Copy Build Scripts

```bash
# Copy from existing plugin
cp ../physick/build.js .
cp ../physick/watch.js .
```

### 5. Update Configuration

Edit `build.js` and `watch.js` to use your plugin name.

Edit `plugin-header.js` with your plugin metadata.

### 6. Update package.json

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "scripts": {
    "build": "node build.js",
    "watch": "node watch.js",
    "dev": "node watch.js",
    "deploy": "npm run build && cp dist/MyPlugin.js ../../../rmmz/Project1/js/plugins/MyPlugin.js",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "physics-engine": "*"
  },
  "devDependencies": {
    "esbuild": "^0.27.0"
  }
}
```

### 7. Start Development

```bash
npm run dev
```

The watch system will automatically detect your new plugin!

## File Organization

### Recommended Structure

```
my-plugin/
├── src/
│   ├── index.js              # Entrypoint
│   ├── managers/
│   │   └── MyManager.js      # Singleton managers
│   ├── scenes/
│   │   ├── Scene_Map.js      # Scene extensions
│   │   └── Scene_Battle.js
│   ├── sprites/
│   │   └── Sprite_Custom.js  # Custom sprites
│   ├── windows/
│   │   └── Window_Base.js    # Window extensions
│   └── objects/
│       └── Game_Player.js    # Game object extensions
├── dist/
│   └── MyPlugin.js           # Built output
├── build.js                   # Build script
├── watch.js                   # Watch script
├── plugin-header.js           # RMMZ metadata
└── package.json
```

### index.js Template

```javascript
// Import collision-detection library
import * as CollisionDetection from 'physics-engine';

// Make available globally
window.CollisionDetection = CollisionDetection;

// Get plugin parameters
window._MyPlugin_params = PluginManager.parameters('MyPlugin');

// Shared state
window._MyPlugin_data = {};

// Import modules
import './managers/MyManager.js';
import './scenes/Scene_Map.js';
import './sprites/Sprite_Custom.js';

// Export public API
window.MyPlugin = {
  getData: () => window._MyPlugin_data,
};

console.log('MyPlugin loaded');
```

## Troubleshooting

### Watch not detecting changes

**Problem:** File changes don't trigger rebuilds

**Solutions:**

- Ensure you're editing files in `src/` not `dist/`
- Check that file extensions are `.js`
- Restart the watch process
- On WSL/Docker, file watching may need polling mode

### Deploy path not found

**Problem:** `RMMZ project not found` warning

**Solutions:**

- Check `dev.config.js` has correct path
- Verify RMMZ project exists at that location
- Use absolute path instead of relative
- Check file permissions

### Build errors after changing files

**Problem:** Build fails with syntax errors

**Solutions:**

- Check console for specific error messages
- Verify ES6 import/export syntax
- Ensure all imported files exist
- Check for circular dependencies

### Plugin not loading in RMMZ

**Problem:** Plugin doesn't appear in Plugin Manager

**Solutions:**

- Verify file is in `js/plugins/` directory
- Check plugin header comment block is valid
- Ensure file ends with `.js`
- Check RMMZ can read the file (permissions)

### Changes not appearing in RMMZ

**Problem:** File deploys but changes don't take effect

**Solutions:**

- Press F5 in RMMZ playtest to reload
- Close and reopen playtest
- Check browser console for errors
- Verify correct file is being deployed

## Performance Tips

### Use Single Plugin Watch During Active Development

Instead of watching all plugins:

```bash
cd packages/rmmz-plugins/physick
npm run dev
```

This is faster and produces cleaner output.

### Disable Auto-Deploy for Inactive Plugins

In `dev.config.js`:

```javascript
plugins: {
  'inactive-plugin': {
    autoDeploy: false,  // Build but don't deploy
  },
}
```

### Clear dist/ Periodically

```bash
npm run clean
npm run build
```

This ensures no stale build artifacts.

## Advanced: Custom Build Steps

### Add Pre-Build Steps

Edit `build.js`:

```javascript
// Before esbuild.build()
console.log('Running pre-build checks...');
// Your custom code here
```

### Add Post-Deploy Steps

Edit `watch.js`:

```javascript
function deploy() {
  // ... existing deploy code ...

  // Add post-deploy hook
  console.log('Running post-deploy steps...');
  // Your custom code here
}
```

### Conditional Builds

```javascript
const isProd = process.env.NODE_ENV === 'production';

esbuild.build({
  // ...
  minify: isProd, // Minify in production
  sourcemap: !isProd, // Source maps in development
});
```

## Integration with RMMZ

### Testing Your Plugin

1. Start watch mode: `npm run dev`
2. Open RMMZ and enable plugin
3. Start playtest
4. Make changes to source files
5. Press F5 in game to reload
6. See changes immediately!

### Distribution

When ready to distribute:

```bash
# Build production version
npm run build

# Your plugin is in dist/
ls dist/Physick.js
```

Copy `dist/Physick.js` to distribute to users.

## Next Steps

- Read [BUNDLING.md](./physick/BUNDLING.md) for bundling options
- Check [Plan File](../../.claude/plans/fluttering-jingling-wreath.md) for architecture details
- See individual plugin README files for usage

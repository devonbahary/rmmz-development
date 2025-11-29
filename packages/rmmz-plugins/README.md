# RMMZ Plugins

RMMZ plugins with modular source structure and automatic watch/deploy system.

## Quick Commands

### Development (Watch Mode)

```bash
# Watch single plugin (recommended)
cd physick && npm run dev
cd skip-title && npm run dev

# Watch all plugins
npm run dev
```

Changes to `src/` files will automatically:
- ✅ Rebuild the plugin
- ✅ Deploy to RMMZ project
- Press **F5** in RMMZ to reload

### Production Build

```bash
# Build and deploy one plugin
cd physick && npm run deploy

# Build all plugins
npm run build
```

### First Time Setup

```bash
# Install dependencies
npm install

# Configure RMMZ path (optional)
# Edit dev.config.js if your RMMZ project is elsewhere
```

## Available Plugins

### Physick
Physics engine for RPG Maker MZ using collision-detection library.

**Location:** `physick/`
**Output:** `dist/Physick.js` → `rmmz/Project1/js/plugins/Physick.js`

### SkipTitle
Skip the title screen to start the game immediately.

**Location:** `skip-title/`
**Output:** `dist/SkipTitle.js` → `rmmz/Project1/js/plugins/SkipTitle.js`

## Documentation

- **[DEV_GUIDE.md](./DEV_GUIDE.md)** - Complete development guide
- **[dev.config.js](./dev.config.js)** - Configuration file
- **[physick/BUNDLING.md](./physick/BUNDLING.md)** - Plugin bundling guide

## Architecture

Plugins use a modular source structure:

```
plugin-name/
├── src/
│   ├── index.js          # Entrypoint
│   ├── managers/         # Singleton managers
│   ├── scenes/           # Scene extensions
│   ├── sprites/          # Custom sprites
│   └── windows/          # Window extensions
├── dist/                  # Built output
├── build.js              # esbuild config
├── watch.js              # Watch + deploy
└── plugin-header.js      # RMMZ metadata
```

Source files are bundled into a single plugin file with collision-detection library embedded.

## Adding New Plugins

See [DEV_GUIDE.md § Adding a New Plugin](./DEV_GUIDE.md#adding-a-new-plugin)

## Troubleshooting

**Watch not working?**
- Check you're editing `src/` not `dist/`
- Restart watch process
- Verify paths in `dev.config.js`

**Changes not appearing in RMMZ?**
- Press F5 in playtest to reload
- Check browser console for errors
- Verify file deployed correctly

**Build errors?**
- Read console error messages
- Check ES6 import syntax
- Ensure all imported files exist

Full troubleshooting guide: [DEV_GUIDE.md § Troubleshooting](./DEV_GUIDE.md#troubleshooting)

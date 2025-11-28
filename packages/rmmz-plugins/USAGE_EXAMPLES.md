# collision-detection.js Usage Examples for RMMZ Plugins

The collision-detection library is distributed as a **UMD (Universal Module Definition)** module, which means it works in multiple environments.

## Distribution Formats

The `physics-engine` package provides three build formats:

1. **CommonJS** (`dist/cjs/index.js`) - For Node.js and bundlers
2. **ESM** (`dist/esm/index.js`) - For modern ES modules
3. **UMD** (`dist/umd/index.js`) - For browsers AND modules (hybrid)

The RMMZ plugin file (`lib/collision-detection.js`) uses the UMD build with RMMZ plugin headers.

## Usage Pattern 1: Global via Plugin Manager (Recommended)

**Setup:**

1. Copy `lib/collision-detection.js` to `YourProject/js/plugins/`
2. Enable it in Plugin Manager (must be ABOVE plugins that depend on it)

**In your plugin:**

```javascript
(function () {
  'use strict';

  // Use the global directly
  const { World, Body, Circle, Vector } = window.CollisionDetection;

  // Create physics world
  const world = new World({ gravity: 980 });

  // ... rest of your plugin
})();
```

## Usage Pattern 2: Module Import (Advanced)

**Setup:**

1. Install via npm: `npm install physics-engine`
2. Use with a bundler (webpack, rollup, etc.)

**In your plugin:**

```javascript
// Import as ES module
import { World, Body, Circle, Vector } from 'physics-engine';

// Or CommonJS
const { World, Body, Circle, Vector } = require('physics-engine');

// ... rest of your plugin
```

## Usage Pattern 3: Hybrid (Best of Both Worlds) ✨

This is the **recommended pattern** for distributable plugins that work in multiple environments!

**In your plugin:**

```javascript
(function () {
  'use strict';

  // Try global first, fallback to require() if available
  var CollisionDetection =
    CollisionDetection || (typeof require !== 'undefined' ? require('physics-engine') : null);

  if (!CollisionDetection) {
    throw new Error('collision-detection library not found!');
  }

  const { World, Body, Circle, Vector } = CollisionDetection;

  // ... rest of your plugin
})();
```

**Why this works:**

1. **In browser with `<script>` tag**: `window.CollisionDetection` is defined globally, so the first part succeeds
2. **With bundler/require()**: Global doesn't exist, so it falls back to `require('physics-engine')`
3. **Neither available**: Throws helpful error message

## Complete Example Plugin

Here's a complete example plugin using the hybrid pattern:

```javascript
//=============================================================================
// MyPhysicsPlugin.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc My custom physics plugin
 * @author YourName
 *
 * @help MyPhysicsPlugin.js
 *
 * Requires: collision-detection.js (enable it ABOVE this plugin)
 * Or: npm install physics-engine
 */

(function () {
  'use strict';

  // Hybrid import pattern
  var CollisionDetection =
    CollisionDetection || (typeof require !== 'undefined' ? require('physics-engine') : null);

  if (!CollisionDetection) {
    throw new Error(
      'MyPhysicsPlugin: collision-detection.js not found!\n' +
        'Enable collision-detection.js in Plugin Manager above this plugin.'
    );
  }

  const { World, Body, BodyType, Circle, Vector, Material } = CollisionDetection;

  let physicsWorld = null;

  // Initialize on map load
  const _Scene_Map_create = Scene_Map.prototype.create;
  Scene_Map.prototype.create = function () {
    _Scene_Map_create.call(this);

    // Create physics world
    physicsWorld = new World({
      gravity: 980,
      timeStep: 1 / 60,
      spatialCellSize: 48,
    });

    // Add some example bodies
    const ball = new Body(new Circle(new Vector(400, 100), 20), BodyType.Dynamic, Material.BOUNCY);
    ball.setMass(1);
    physicsWorld.addBody(ball);

    console.log('MyPhysicsPlugin: World initialized');
  };

  // Update each frame
  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function () {
    _Scene_Map_update.call(this);

    if (physicsWorld) {
      physicsWorld.step(1 / 60);
    }
  };

  // Export for other plugins
  window.MyPhysicsWorld = () => physicsWorld;

  console.log('MyPhysicsPlugin loaded');
})();
```

## How UMD Works

The UMD wrapper in `dist/umd/index.js` detects the environment:

```javascript
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD (RequireJS)
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS (Node.js, Browserify, webpack)
    module.exports = factory();
  } else {
    // Browser global
    root.CollisionDetection = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  // ... library code ...
});
```

This means:

- ✅ Works with `<script>` tags (sets `window.CollisionDetection`)
- ✅ Works with `require()` (returns module)
- ✅ Works with `import` (when transpiled)
- ✅ Works with AMD loaders

## Distribution Checklist

When distributing your plugin:

**Option A: Script-only (simple)**

- Include `lib/collision-detection.js` with your plugin
- Users copy both files to `js/plugins/`
- Enable both in Plugin Manager

**Option B: npm package (advanced)**

- Publish to npm with `physics-engine` as dependency
- Users install via npm and bundle

**Option C: Hybrid (flexible)**

- Provide both distribution methods
- Your plugin uses the hybrid pattern above
- Works in both scenarios!

## Testing Your Plugin

```javascript
// Test if collision-detection is available
if (typeof CollisionDetection !== 'undefined') {
  console.log('✓ CollisionDetection available globally');
}

// Test if require works
if (typeof require !== 'undefined') {
  try {
    const CD = require('physics-engine');
    console.log('✓ CollisionDetection available via require()');
  } catch (e) {
    console.log('✗ require() not available or package not installed');
  }
}
```

# Physick - RMMZ Physics Plugin

Physics engine plugin for RPG Maker MZ using the collision-detection library.

## Installation

**Important:** This plugin requires two files to be installed:

1. Copy `../lib/collision-detection.js` to your RMMZ project's `js/plugins/` folder
2. Copy `dist/Physick.js` to your RMMZ project's `js/plugins/` folder
3. In RMMZ Plugin Manager:
   - Enable `collision-detection` first (must be above Physick)
   - Enable `Physick` second (must be below collision-detection)
4. Configure gravity and other parameters in Physick settings

## Load Order

```
Plugin Manager:
├─ collision-detection.js  ← Load first
└─ Physick.js              ← Load second
```

## Usage

The physics world is available globally:
```javascript
const world = window.PhysicsWorld();

// Create a physics body
const { Body, BodyType, Circle, Vector } = window.CollisionDetection;
const ball = new Body(
  new Circle(new Vector(100, 100), 20),
  BodyType.Dynamic
);
world.addBody(ball);
```

## Building

From the rmmz-plugins directory:
```bash
npm run build
```

This builds both the shared library and all plugins.

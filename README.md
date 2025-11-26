# Collision Detection Library

A standalone TypeScript 2D physics engine with collision detection for circles and rectangles.

## Features

- **Standalone Library** - Framework-agnostic, works anywhere JavaScript runs
- **2D Physics** - Full physics simulation with velocity, acceleration, mass, and forces
- **Collision Detection** - Efficient detection between circles and axis-aligned rectangles
- **Collision Resolution** - Both elastic and inelastic collisions with configurable restitution
- **Spatial Optimization** - Spatial hash grid for efficient broad-phase collision detection
- **Floating-Point Safety** - Robust epsilon guards throughout to prevent numerical errors
- **Pure Geometry** - Shapes can be used independently for area effects and spatial queries
- **TypeScript** - Full type safety and excellent IDE support

## Installation

```bash
npm install @devon/collision-detection
```

## Quick Start

```typescript
import { World, Body, BodyType, Circle, Rectangle, Vector, Material } from '@devon/collision-detection';

// Create a physics world
const world = new World({
  gravity: new Vector(0, 980), // 980 pixels/s² downward
  timeStep: 1/60,              // 60 FPS
  spatialCellSize: 100         // Grid cell size
});

// Create a static ground
const ground = new Body(
  new Rectangle(new Vector(0, 500), new Vector(800, 520)),
  BodyType.Static
);
world.addBody(ground);

// Create a dynamic bouncing ball
const ball = new Body(
  new Circle(new Vector(400, 100), 20),
  BodyType.Dynamic,
  Material.BOUNCY
);
ball.setMass(1);
world.addBody(ball);

// Game loop (60 FPS)
function gameLoop() {
  world.step(1/60);

  // Render bodies...
  for (const body of world.getBodies()) {
    console.log(`Body ${body.id} at`, body.position);
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
```

## Using Shapes for Area Effects

Shapes can be used independently without physics bodies for spatial queries:

```typescript
import { Circle, Rectangle, Vector } from '@devon/collision-detection';

// Create an explosion area
const explosionArea = new Circle(new Vector(300, 300), 100);

// Check which bodies are affected
for (const body of world.getBodies()) {
  if (explosionArea.overlaps(body.shape)) {
    console.log(`Body ${body.id} is in explosion radius!`);
    // Apply damage, knockback, etc.
  }
}
```

## Core Concepts

### Body Types

- **Static** - Immovable objects like walls and ground (infinite mass)
- **Dynamic** - Fully simulated objects affected by forces and collisions
- **Kinematic** - Movable but not affected by forces (controlled externally)

### Materials

Pre-defined materials with different physical properties:

```typescript
Material.DEFAULT    // Balanced properties
Material.BOUNCY     // High restitution (0.9), low friction
Material.HEAVY      // High density (10x), low restitution
Material.LIGHT      // Low density (0.1x), medium restitution
Material.FRICTIONLESS // Zero friction
```

### Collision Filtering

Use layer/mask bitmasks for flexible collision groups:

```typescript
// Player only collides with enemies and walls
player.layer = 0b0001;  // Player layer
player.mask = 0b0110;   // Collides with enemies (0b0010) and walls (0b0100)

enemy.layer = 0b0010;   // Enemy layer
enemy.mask = 0b0001;    // Collides with player

wall.layer = 0b0100;    // Wall layer
wall.mask = 0xFFFFFFFF; // Collides with everything
```

## API Reference

### World

```typescript
const world = new World(config);
world.addBody(body);
world.removeBody(body);
world.step(deltaTime);
world.queryPoint(point);
world.queryRegion(aabb);
world.setGravity(gravity);
```

### Body

```typescript
body.applyForce(force);
body.applyImpulse(impulse);
body.setMass(mass);
body.setPosition(position);
body.setVelocity(velocity);
```

### Shapes

```typescript
const circle = new Circle(center, radius);
const rect = Rectangle.fromCenter(center, width, height);

shape.contains(point);
shape.overlaps(otherShape);
shape.getAABB();
shape.getArea();
```

### Vector

```typescript
const v = new Vector(x, y);
v.add(other);
v.subtract(other);
v.multiply(scalar);
v.normalize();
v.dot(other);
v.length();
```

## RPG Maker MZ Integration

Example plugin integration:

```javascript
// Load the UMD build in your plugin
const { World, Body, BodyType, Circle, Vector, Material } = Physics2D;

// In Scene_Map
const world = new World({
  gravity: new Vector(0, 300),
  spatialCellSize: 100
});

// Hook into update loop
const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
  _Scene_Map_update.call(this);
  world.step(1/60);

  // Update sprite positions from physics bodies
  // ...
};
```

## Performance

- Handles 100+ bodies at 60 FPS
- O(n) collision detection with spatial hash (vs O(n²) naive)
- Minimal garbage collection through object reuse
- Optimized floating-point operations

## License

MIT

## Contributing

Issues and pull requests welcome!

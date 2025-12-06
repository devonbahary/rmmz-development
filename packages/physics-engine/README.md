# physics-engine

TypeScript 2D top-down physics engine with collision detection for circles and rectangles.

## Features

- Top-down 2D physics model (XY ground plane + Z-axis gravity)
- Circles and axis-aligned rectangles
- Impulse-based collision resolution
- Spatial hash grid optimization
- Zero runtime dependencies

## Configuration Parameters

When creating a `World`, you can configure several parameters that affect physics simulation behavior:

### Iteration Parameters

These parameters control the accuracy and stability of collision resolution:

#### `positionIterations` (default: 1)

Number of iterations for position constraint solving. Controls how aggressively overlapping bodies are separated.

- **Lower values (1)**: Smoother collision response, less aggressive correction. Bodies may slightly penetrate but collisions feel more natural.
- **Higher values (3-4)**: More accurate position correction, bodies separate more aggressively. Can cause bouncing or jittery behavior in some scenarios.
- **Recommendation**: Use 1-2 for most scenarios. Start with 1 for smooth character movement.

#### `velocityIterations` (default: 6)

Number of iterations for velocity constraint solving. Controls how accurately velocities are resolved during collisions.

- **Lower values (2-4)**: Faster but less accurate velocity resolution. May cause bodies to gain or lose energy incorrectly.
- **Higher values (8-10)**: More accurate velocity resolution but more expensive computationally.
- **Recommendation**: Use 6 for most scenarios (good balance of accuracy and performance).

### Other Parameters

- **`gravity`**: Damping force magnitude (affects friction-based damping = gravity × friction × mass)
- **`timeStep`**: Fixed timestep for physics updates (typically 1/60 for 60 FPS)
- **`spatialCellSize`**: Size of spatial hash grid cells for collision detection optimization

### Example Configuration

```javascript
const world = new World({
  gravity: 1, // Low gravity for gentle damping
  timeStep: 1 / 60, // 60 FPS
  positionIterations: 1, // Smooth collision response
  velocityIterations: 6, // Standard accuracy
  spatialCellSize: 100, // Optimize for ~100 unit objects
});
```

## Usage

See [examples/](./examples/) for complete examples.

## Development

### Running the Test App

A browser-based test application is included for interactive testing and debugging:

```bash
npm run dev
```

This will:
- Start the watch mode bundler (auto-rebuilds on changes)
- Serve the test app at http://localhost:3000
- Automatically open the test app in your browser

Use arrow keys to move the blue player circle and test collision behavior against the red walls and obstacles.

### Available Scripts

- `npm run build` - Build the TypeScript source to ESM
- `npm run build:test-app` - Bundle the test app (one-time)
- `npm run watch:test-app` - Watch and rebuild test app on changes
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode

### Monorepo

This package is part of a monorepo. See the [root README](../../README.md) for overall development workflow.

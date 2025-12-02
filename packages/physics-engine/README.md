# physics-engine

TypeScript 2D top-down physics engine with collision detection for circles and rectangles.

## Features

- Top-down 2D physics model (XY ground plane + Z-axis gravity)
- Circles and axis-aligned rectangles
- Impulse-based collision resolution
- Spatial hash grid optimization
- Zero runtime dependencies

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

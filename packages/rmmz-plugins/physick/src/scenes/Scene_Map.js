//=============================================================================
// Scene_Map
//=============================================================================

import { Body, Rectangle, Vector, World } from 'physics-engine';
import { DEFAULT_CHARACTER_RADIUS, EDGE_THICKNESS } from '../constants';
import { toWorldSize, aggregateEdgeArray, aggregateIntoRectangles } from '../utilities/map';

const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
Scene_Map.prototype.onMapLoaded = function () {
  _Scene_Map_onMapLoaded.call(this);
  this.initPhysick();
};

Scene_Map.prototype.initPhysick = function () {
  this.initPhysickWorld();
  this.initPhysickPlayer();
};

Scene_Map.prototype.initPhysickWorld = function () {
  const width = $gameMap.width();
  const height = $gameMap.height();

  this.world = new World({
    spatialCellSize: toWorldSize(1), // spatialCell should be 1 tile in size
    gravity: 20, // Default damping brings characters to rest
  });

  // Hybrid approach: full rectangles + per-edge
  const edges = this.getTileEdges();

  // Create optimized full-tile rectangles
  const fullTiles = this.getImpassableTiles();
  const collisionRects = this.aggregateIntoRectangles(fullTiles);
  this.createStaticBodies(collisionRects);

  // Filter out edges from full tiles and create thin bodies for partial edges
  const partialEdges = {
    horizontal: edges.horizontal.filter((e) => !e.isFullTile),
    vertical: edges.vertical.filter((e) => !e.isFullTile),
  };
  const aggregatedEdges = this.aggregateEdges(partialEdges);
  this.createEdgeBodies(aggregatedEdges);
};

// Check if a tile is completely impassable (from all 4 directions)
Scene_Map.prototype.isTileImpassable = function (x, y) {
  // Check all 4 cardinal directions: down(2), left(4), right(6), up(8)
  const directions = [2, 4, 6, 8];

  for (const d of directions) {
    if ($gameMap.isPassable(x, y, d)) {
      return false; // Passable from at least one direction
    }
  }

  return true; // Impassable from all directions
};

// Get all impassable tile positions
Scene_Map.prototype.getImpassableTiles = function () {
  const width = $gameMap.width();
  const height = $gameMap.height();
  const impassable = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (this.isTileImpassable(x, y)) {
        impassable.push({ x, y });
      }
    }
  }

  return impassable;
};

// Get all tile edges (for per-edge collision detection)
Scene_Map.prototype.getTileEdges = function () {
  const width = $gameMap.width();
  const height = $gameMap.height();
  const edges = {
    horizontal: [],
    vertical: [],
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Check each direction's passability
      const up = $gameMap.isPassable(x, y, 8);
      const down = $gameMap.isPassable(x, y, 2);
      const left = $gameMap.isPassable(x, y, 4);
      const right = $gameMap.isPassable(x, y, 6);

      const isFullTile = !up && !down && !left && !right;

      // Add edge for each blocked direction
      if (!up) {
        edges.horizontal.push({
          position: y,
          start: x,
          end: x + 1,
          isFullTile,
        });
      }
      if (!down) {
        edges.horizontal.push({
          position: y + 1,
          start: x,
          end: x + 1,
          isFullTile,
        });
      }
      if (!left) {
        edges.vertical.push({
          position: x,
          start: y,
          end: y + 1,
          isFullTile,
        });
      }
      if (!right) {
        edges.vertical.push({
          position: x + 1,
          start: y,
          end: y + 1,
          isFullTile,
        });
      }
    }
  }

  return edges;
};

// Aggregate edges (merge adjacent aligned edges into longer segments)
Scene_Map.prototype.aggregateEdges = function (edges) {
  return {
    horizontal: aggregateEdgeArray(edges.horizontal),
    vertical: aggregateEdgeArray(edges.vertical),
  };
};

// Aggregate tiles into rectangles using greedy algorithm
Scene_Map.prototype.aggregateIntoRectangles = function (tiles) {
  const width = $gameMap.width();
  const height = $gameMap.height();
  return aggregateIntoRectangles(tiles, width, height);
};

// Create static physics bodies from rectangles
Scene_Map.prototype.createStaticBodies = function (rectangles) {
  for (const rect of rectangles) {
    // Convert tile coordinates (top-left) to world coordinates
    // RMMZ tiles: (x, y) is the top-left corner of the tile
    // Physics Rectangle needs min (top-left) and max (bottom-right) corners in world space
    // Don't use toWorldCoords here since that adds TILE_CENTER_OFFSET for centers

    const minX = toWorldSize(rect.x);
    const minY = toWorldSize(rect.y);
    const maxX = toWorldSize(rect.x + rect.width);
    const maxY = toWorldSize(rect.y + rect.height);

    const rectShape = new Rectangle(new Vector(minX, minY), new Vector(maxX, maxY));

    const body = new Body(rectShape);
    body.setStatic();
    this.world.addBody(body);
  }

  console.log(`Created ${rectangles.length} collision rectangles from impassable tiles`);
};

// Create thin static physics bodies from edges
Scene_Map.prototype.createEdgeBodies = function (aggregatedEdges) {
  const thickness = toWorldSize(EDGE_THICKNESS);

  let bodyCount = 0;

  // Create horizontal edge bodies (top/bottom edges of tiles)
  for (const edge of aggregatedEdges.horizontal) {
    const worldY = toWorldSize(edge.position);
    const worldStartX = toWorldSize(edge.start);
    const worldEndX = toWorldSize(edge.end);

    // Thin horizontal rectangle centered on edge
    const min = new Vector(worldStartX, worldY - thickness / 2);
    const max = new Vector(worldEndX, worldY + thickness / 2);

    const rectShape = new Rectangle(min, max);
    const body = new Body(rectShape);
    body.setStatic();
    this.world.addBody(body);
    bodyCount++;
  }

  // Create vertical edge bodies (left/right edges of tiles)
  for (const edge of aggregatedEdges.vertical) {
    const worldX = toWorldSize(edge.position);
    const worldStartY = toWorldSize(edge.start);
    const worldEndY = toWorldSize(edge.end);

    // Thin vertical rectangle centered on edge
    const min = new Vector(worldX - thickness / 2, worldStartY);
    const max = new Vector(worldX + thickness / 2, worldEndY);

    const rectShape = new Rectangle(min, max);
    const body = new Body(rectShape);
    body.setStatic();
    this.world.addBody(body);
    bodyCount++;
  }

  console.log(`Created ${bodyCount} edge collision bodies from tile passability`);
};

Scene_Map.prototype.initPhysickPlayer = function () {
  $gamePlayer.createPhysicsBody(this.world, {
    shape: 'circle',
    radius: DEFAULT_CHARACTER_RADIUS, // in game units (tiles)
    mass: 1,
  });
};

const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function () {
  if (this.world && $gamePlayer.body) {
    // Save position BEFORE physics step for camera delta calculation
    $gamePlayer.saveScrollPositionForCamera();

    // Step physics simulation
    const deltaTime = 1 / 60; // RMMZ runs at 60 FPS
    this.world.step(deltaTime);

    // NO explicit _realX/_realY sync - property getters in Game_CharacterBase
    // already read from body.position on-demand, making this sync redundant
  }

  // Call vanilla update (input processing + camera)
  _Scene_Map_update.call(this);
};

const _Scene_Map_terminate = Scene_Map.prototype.terminate;
Scene_Map.prototype.terminate = function () {
  // Clean up character physics bodies
  if (this.world) {
    if ($gamePlayer && $gamePlayer.body) {
      $gamePlayer.removePhysicsBody(this.world);
    }
    // Could also clean up event bodies if we add those later
  }

  _Scene_Map_terminate.call(this);
};

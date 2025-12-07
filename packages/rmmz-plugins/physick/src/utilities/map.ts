import { Rectangle, Vector } from 'physics-engine';
import { EDGE_THICKNESS, TILE_CENTER_OFFSET } from '../constants';

/**
 * Convert game units to world size (pixels)
 */
export function toWorldSize(gameUnit: number): number {
  return gameUnit * tileSize();
}

function tileSize() {
  // assuming width + height are the same
  return Math.max($gameMap.tileWidth(), $gameMap.tileHeight());
}

/**
 * Convert tile coordinates to world coordinates
 */
export function toWorldCoords(x: number, y: number): Vector {
  const worldX = toWorldSize(x + TILE_CENTER_OFFSET);
  const worldY = toWorldSize(y + TILE_CENTER_OFFSET);
  return new Vector(worldX, worldY);
}

/**
 * Convert world coordinates to tile coordinates
 */
export function fromWorldCoords(worldX: number, worldY: number): { x: number; y: number } {
  return {
    x: worldX / tileSize() - TILE_CENTER_OFFSET,
    y: worldY / tileSize() - TILE_CENTER_OFFSET,
  };
}

interface Edge {
  position: number;
  start: number;
  end: number;
  isFullTile: boolean;
}

// Check if a tile is completely impassable (from all 4 directions)
function isTileImpassable(x, y) {
  // Check all 4 cardinal directions: down(2), left(4), right(6), up(8)
  const directions = [2, 4, 6, 8];

  for (const d of directions) {
    if ($gameMap.isPassable(x, y, d)) {
      return false; // Passable from at least one direction
    }
  }

  return true; // Impassable from all directions
}

// Get all impassable tile positions
function getImpassableTiles() {
  const width = $gameMap.width();
  const height = $gameMap.height();
  const impassable = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isTileImpassable(x, y)) {
        impassable.push({ x, y });
      }
    }
  }

  return impassable;
}

// Get all tile edges (for per-edge collision detection)
function getTileEdges(): { horizontal: Edge[]; vertical: Edge[] } {
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
}

/**
 * Aggregate edge array (merge adjacent aligned edges into longer segments)
 */
export function aggregateEdgeArray(edgeArray: Edge[]): Edge[] {
  if (edgeArray.length === 0) return [];

  // Sort by position, then by start coordinate
  const sorted = edgeArray.slice().sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.start - b.start;
  });

  const aggregated: Edge[] = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // Merge if adjacent and aligned
    if (next.position === current.position && next.start === current.end) {
      current.end = next.end;
      current.isFullTile = current.isFullTile && next.isFullTile;
    } else {
      aggregated.push(current);
      current = next;
    }
  }

  aggregated.push(current);
  return aggregated;
}

interface Tile {
  x: number;
  y: number;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Aggregate tiles into rectangles using greedy algorithm
 */
export function aggregateIntoRectangles(tiles: Tile[], width: number, height: number): Rectangle[] {
  if (tiles.length === 0) return [];

  // Create 2D grid for fast lookup
  const grid = Array(height)
    .fill(null)
    .map(() => Array(width).fill(false));
  for (const tile of tiles) {
    grid[tile.y][tile.x] = true;
  }

  const rectangles: Rectangle[] = [];
  const visited = Array(height)
    .fill(null)
    .map(() => Array(width).fill(false));

  // Greedy rectangle merging: start from each unvisited tile
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!grid[y][x] || visited[y][x]) continue;

      // Find maximum width for this row
      let maxWidth = 1;
      while (x + maxWidth < width && grid[y][x + maxWidth] && !visited[y][x + maxWidth]) {
        maxWidth++;
      }

      // Extend rectangle downward as far as possible
      let maxHeight = 1;
      let canExtend = true;
      while (y + maxHeight < height && canExtend) {
        for (let dx = 0; dx < maxWidth; dx++) {
          if (!grid[y + maxHeight][x + dx] || visited[y + maxHeight][x + dx]) {
            canExtend = false;
            break;
          }
        }
        if (canExtend) maxHeight++;
      }

      // Mark all tiles in this rectangle as visited
      for (let dy = 0; dy < maxHeight; dy++) {
        for (let dx = 0; dx < maxWidth; dx++) {
          visited[y + dy][x + dx] = true;
        }
      }

      rectangles.push({
        x: x,
        y: y,
        width: maxWidth,
        height: maxHeight,
      });
    }
  }

  return rectangles;
}

export function* getImpassableTileRects() {
  const tiles = getImpassableTiles();

  const collisionRects = aggregateIntoRectangles(tiles, $gameMap.width(), $gameMap.height());

  for (const rect of collisionRects) {
    // Convert tile coordinates (top-left) to world coordinates
    // RMMZ tiles: (x, y) is the top-left corner of the tile
    // Physics Rectangle needs min (top-left) and max (bottom-right) corners in world space
    // Don't use toWorldCoords here since that adds offset for centers

    const minX = toWorldSize(rect.x);
    const minY = toWorldSize(rect.y);
    const maxX = toWorldSize(rect.x + rect.width);
    const maxY = toWorldSize(rect.y + rect.height);

    yield new Rectangle(new Vector(minX, minY), new Vector(maxX, maxY));
  }
}

// Create thin static physics bodies from edges
export function* getImpassableTileEdges() {
  const edges = getTileEdges();

  const partialEdges = {
    horizontal: edges.horizontal.filter((e) => !e.isFullTile),
    vertical: edges.vertical.filter((e) => !e.isFullTile),
  };

  // Aggregate edges (merge adjacent aligned edges into longer segments)
  const aggregatedEdges = {
    horizontal: aggregateEdgeArray(edges.horizontal),
    vertical: aggregateEdgeArray(edges.vertical),
  };

  const thickness = toWorldSize(EDGE_THICKNESS);

  // Create horizontal edge bodies (top/bottom edges of tiles)
  for (const edge of aggregatedEdges.horizontal) {
    const worldY = toWorldSize(edge.position);
    const worldStartX = toWorldSize(edge.start);
    const worldEndX = toWorldSize(edge.end);

    // Thin horizontal rectangle centered on edge
    const min = new Vector(worldStartX, worldY - thickness / 2);
    const max = new Vector(worldEndX, worldY + thickness / 2);

    yield new Rectangle(min, max);
  }

  // Create thin static physics bodies from edges
  for (const edge of aggregatedEdges.vertical) {
    const worldX = toWorldSize(edge.position);
    const worldStartY = toWorldSize(edge.start);
    const worldEndY = toWorldSize(edge.end);

    // Thin vertical rectangle centered on edge
    const min = new Vector(worldX - thickness / 2, worldStartY);
    const max = new Vector(worldX + thickness / 2, worldEndY);

    yield new Rectangle(min, max);
  }
}

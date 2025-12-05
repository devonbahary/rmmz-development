import { Vector } from 'physics-engine';
import { TILE_CENTER_OFFSET } from '../constants';

/**
 * Convert game units to world size (pixels)
 */
export function toWorldSize(gameUnit: number): number {
  // assuming width + height are the same
  const pxInGameUnit = Math.max($gameMap.width(), $gameMap.height());
  return gameUnit * pxInGameUnit;
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
  const pxInGameUnit = Math.max($gameMap.width(), $gameMap.height());
  return {
    x: worldX / pxInGameUnit - TILE_CENTER_OFFSET,
    y: worldY / pxInGameUnit - TILE_CENTER_OFFSET,
  };
}

interface Edge {
  position: number;
  start: number;
  end: number;
  isFullTile: boolean;
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

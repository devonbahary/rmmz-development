import { Vector } from 'physics-engine';
import { TILE_CENTER_OFFSET } from '../constants';

/**
 * Decompose dir8 (1-9) into horizontal and vertical components
 * Returns {horz: 0|4|6, vert: 0|2|8}
 */
function decomposeDirection(d: number): { horz: number; vert: number } {
  switch (d) {
    case 1:
      return { horz: 4, vert: 2 }; // Down-Left
    case 2:
      return { horz: 0, vert: 2 }; // Down
    case 3:
      return { horz: 6, vert: 2 }; // Down-Right
    case 4:
      return { horz: 4, vert: 0 }; // Left
    case 6:
      return { horz: 6, vert: 0 }; // Right
    case 7:
      return { horz: 4, vert: 8 }; // Up-Left
    case 8:
      return { horz: 0, vert: 8 }; // Up
    case 9:
      return { horz: 6, vert: 8 }; // Up-Right
    default:
      return { horz: 0, vert: 0 }; // No movement
  }
}

/**
 * Determine display direction from movement dir8 and current facing
 * Always returns a cardinal direction (2,4,6,8) for sprite display
 * Logic: Choose the component that differs from current direction
 */
export function getDisplayDirection(movementDir: number, currentDir: number): number {
  const { horz, vert } = decomposeDirection(movementDir);

  // Pure cardinal movement - use that direction
  if (horz === 0) return vert || currentDir;
  if (vert === 0) return horz || currentDir;

  // Diagonal movement - choose the component that changed
  // Priority 1: If current is horizontal and differs from new horizontal, use vertical
  if ((currentDir === 4 || currentDir === 6) && currentDir !== horz) {
    return vert;
  }

  // Priority 2: If current is vertical and differs from new vertical, use horizontal
  if ((currentDir === 2 || currentDir === 8) && currentDir !== vert) {
    return horz;
  }

  // Priority 3: Default to horizontal component
  return horz;
}

/**
 * Convert RMMZ direction (1-9) to normalized velocity vector
 * All directions have the same magnitude (speedInTiles)
 */
export function getVelocityForDirection(d: number, speedInTiles: number): Vector {
  const components = decomposeDirection(d);
  const horz = components.horz;
  const vert = components.vert;

  // Build velocity from components
  let vx = 0;
  let vy = 0;

  if (horz === 4) vx = -1; // Left
  if (horz === 6) vx = 1; // Right
  if (vert === 2) vy = 1; // Down (positive Y in RMMZ)
  if (vert === 8) vy = -1; // Up

  // No movement
  if (vx === 0 && vy === 0) {
    return Vector.zero();
  }

  // Convert to world coordinates and normalize
  const pixelSpeed = window._physick_toWorldSize(speedInTiles);
  const velocity = new Vector(vx, vy);

  // Normalize to ensure diagonal movement has same magnitude as cardinal
  return velocity.normalize().multiply(pixelSpeed);
}

/**
 * Convert dir8 (1-9) from horz + vert components
 */
export function composeDirection(horz: number, vert: number): number {
  if (horz === 4 && vert === 2) return 1; // Down-Left
  if (horz === 6 && vert === 2) return 3; // Down-Right
  if (horz === 4 && vert === 8) return 7; // Up-Left
  if (horz === 6 && vert === 8) return 9; // Up-Right
  return 5; // Default: no movement
}

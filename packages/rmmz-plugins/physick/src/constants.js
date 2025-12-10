//-----------------------------------------------------------------------------
// Physick Constants
//
// Centralized configuration values for the physics plugin

import { Material } from 'physics-engine';

export const COLLISION_CATEGORIES = {
  NONE: 0x0000,
  STATIC: 0x0001,
  BELOW_CHARACTERS: 0x0002,
  SAME_AS_CHARACTERS: 0x0004,
  ABOVE_CHARACTERS: 0x0008,
};

// ===== Material Constants =====

/**
 * Material for dynamic characters
 * Matches test-app.js (line 64) for perfect collision behavior
 * - Restitution 0.5: Works with physics engine's anti-bounce logic
 * - Friction 0.8: Provides proper damping when gravity = 1
 */
export const CHARACTER_MATERIAL = new Material(0.5, 0.8);

// ===== Movement Constants =====

/**
 * RMMZ delta time (1/60 second per frame)
 * RMMZ runs at 60 FPS
 */
export const RMMZ_DELTA_TIME = 1 / 60;

/**
 * Velocity threshold for determining if a character is moving
 * Below this squared magnitude, the character is considered stopped
 */
export const MOVEMENT_VELOCITY_THRESHOLD_SQ = 0.01;

// ===== Character Body Defaults =====

/**
 * Default character body radius in game units (tiles)
 * Used when creating circular character bodies
 */
export const DEFAULT_CHARACTER_RADIUS = 0.5;

/**
 * Default character body width in game units (tiles)
 * Used when creating rectangular character bodies
 */
export const DEFAULT_CHARACTER_WIDTH = 0.8;

/**
 * Default character body height in game units (tiles)
 * Used when creating rectangular character bodies
 */
export const DEFAULT_CHARACTER_HEIGHT = 0.8;

// ===== Tile Collision Constants =====

/**
 * Edge thickness for partially impassable tiles in game units
 * Thin enough to be visually imperceptible, thick enough to prevent tunneling
 */
export const EDGE_THICKNESS = 0.01;

/**
 * Tile center offset for coordinate conversion
 * RMMZ tiles reference top-left corner, physics uses center
 */
export const TILE_CENTER_OFFSET = 0.5;

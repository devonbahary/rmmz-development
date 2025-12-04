//-----------------------------------------------------------------------------
// Physick Constants
//
// Centralized configuration values for the physics plugin

// ===== Movement Constants =====

/**
 * Impulse multiplier for character movement
 * Higher values = faster acceleration response to input
 */
export const MOVEMENT_IMPULSE_MULTIPLIER = 20;

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

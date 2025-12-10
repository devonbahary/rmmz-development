/**
 * Collision event type constants
 * These are the valid event types that can be emitted by the physics world
 */
export const COLLISION_EVENT_TYPES = {
  /** Emitted when two bodies first collide */
  START: 'collision-start',
  /** Emitted each frame while two bodies remain in contact */
  ACTIVE: 'collision-active',
  /** Emitted when two bodies stop colliding */
  END: 'collision-end'
} as const;

// Export individual constants for convenience
export const COLLISION_START = COLLISION_EVENT_TYPES.START;
export const COLLISION_ACTIVE = COLLISION_EVENT_TYPES.ACTIVE;
export const COLLISION_END = COLLISION_EVENT_TYPES.END;

// Type helper for validation
export type CollisionEventType = typeof COLLISION_EVENT_TYPES[keyof typeof COLLISION_EVENT_TYPES];

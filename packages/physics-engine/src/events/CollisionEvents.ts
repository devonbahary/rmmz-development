import type { Body } from '../physics/Body';
import type { Manifold } from '../collision/Manifold';

/**
 * Collision event data
 * Contains the colliding bodies, sensor flag, and manifold data
 */
export interface CollisionEvent {
  /** First body in the collision */
  bodyA: Body;

  /** Second body in the collision */
  bodyB: Body;

  /** True if either body is a sensor */
  isSensor: boolean;

  /**
   * Collision manifold containing contact points, normals, and penetration data
   * Undefined for collision-end events (collision already ended, no contact data)
   */
  manifold?: Manifold;
}

/**
 * Type-safe event map for collision events
 */
export interface CollisionEventMap {
  /** Emitted when two bodies first collide */
  'collision-start': CollisionEvent;

  /** Emitted each frame while two bodies remain in contact */
  'collision-active': CollisionEvent;

  /** Emitted when two bodies stop colliding */
  'collision-end': CollisionEvent;
}

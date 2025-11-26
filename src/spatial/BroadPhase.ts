import { Body } from '../physics/Body';
import { AABB } from '../geometry/AABB';
import { Pair } from './Pair';

/**
 * Interface for broad-phase collision detection
 * Provides spatial optimization to avoid O(n²) collision checks
 */
export interface BroadPhase {
  /**
   * Insert a body into the spatial structure
   */
  insert(body: Body): void;

  /**
   * Remove a body from the spatial structure
   */
  remove(body: Body): void;

  /**
   * Update a body's position in the spatial structure
   */
  update(body: Body): void;

  /**
   * Clear all bodies from the spatial structure
   */
  clear(): void;

  /**
   * Query for bodies that might collide with the given body
   */
  query(body: Body): Body[];

  /**
   * Query for bodies in a specific region
   */
  queryRegion(aabb: AABB): Body[];

  /**
   * Get all potential collision pairs
   */
  getPairs(): Pair[];
}

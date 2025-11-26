import { Body } from '../physics/Body';

/**
 * Represents a pair of bodies that might collide
 */
export class Pair {
  constructor(
    public bodyA: Body,
    public bodyB: Body
  ) {}

  /**
   * Generate a unique hash for this pair (order-independent)
   */
  static hash(bodyA: Body, bodyB: Body): string {
    // Ensure consistent ordering
    if (bodyA.id < bodyB.id) {
      return `${bodyA.id}_${bodyB.id}`;
    }
    return `${bodyB.id}_${bodyA.id}`;
  }

  getHash(): string {
    return Pair.hash(this.bodyA, this.bodyB);
  }
}

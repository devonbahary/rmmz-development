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
  static hash(bodyA: Body, bodyB: Body): number {
    // Ensure consistent ordering using Cantor pairing function
    const [a, b] = bodyA.id < bodyB.id ? [bodyA.id, bodyB.id] : [bodyB.id, bodyA.id];
    return ((a + b) * (a + b + 1)) / 2 + b;
  }

  getHash(): number {
    return Pair.hash(this.bodyA, this.bodyB);
  }
}

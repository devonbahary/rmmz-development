import { Vector } from '../math/Vector';

/**
 * Represents a single contact point in a collision
 */
export class Contact {
  constructor(
    /** Contact point in world space */
    public point: Vector,
    /** Normal from bodyA to bodyB */
    public normal: Vector,
    /** Penetration depth */
    public penetration: number
  ) {}
}

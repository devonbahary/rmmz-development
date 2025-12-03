import { Body } from '../physics/Body';
import { Contact } from './Contact';
import { EPSILON } from '../math/MathUtils';

/**
 * Collision manifold containing all contacts between two bodies.
 *
 * WHAT'S A MANIFOLD?
 * A manifold is a "collision report" - it stores all the information about
 * a collision between two bodies:
 * - The two bodies involved (bodyA, bodyB)
 * - Contact points (where they're touching - usually 1-2 points)
 * - Combined material properties (restitution, friction)
 *
 * Think of it like a bundle that says "Body A and Body B are colliding at
 * these points, with these combined properties."
 */
export class Manifold {
  contacts: Contact[] = [];
  restitution: number;
  friction: number;

  constructor(
    public bodyA: Body,
    public bodyB: Body
  ) {
    this.restitution = this.calculateRestitution();
    this.friction = this.calculateFriction();
  }

  addContact(contact: Contact): void {
    this.contacts.push(contact);
  }

  clear(): void {
    this.contacts = [];
  }

  /**
   * Combined restitution (bounciness) for this collision.
   *
   * RESTITUTION RULES:
   * - Static-Dynamic collision: Use ONLY the dynamic body's restitution
   *   Why? Static bodies (walls, ground) should act as perfect reflectors.
   *   The bounce depends entirely on what hits them.
   *   Example: Ball (0.9) hits wall → bounces at 0.9
   *
   * - Dynamic-Dynamic collision: Use AVERAGE of both restitutions
   *   Why? Both materials contribute to the collision.
   *   Example: Ball A (0.9) hits Ball B (0.5) → bounces at 0.7
   *
   * This gives intuitive behavior where walls don't add or remove energy,
   * they just reflect what hits them.
   */
  private calculateRestitution(): number {
    const isAStatic = this.bodyA.inverseMass < EPSILON;
    const isBStatic = this.bodyB.inverseMass < EPSILON;

    // Static-dynamic: use only dynamic body's restitution
    if (isAStatic && !isBStatic) {
      return this.bodyB.material.restitution;
    }
    if (isBStatic && !isAStatic) {
      return this.bodyA.material.restitution;
    }

    // Dynamic-dynamic: use average
    // This gives balanced, intuitive behavior (0.9 + 0.5 = 0.7)
    return (this.bodyA.material.restitution + this.bodyB.material.restitution) / 2;
  }

  /**
   * Combined friction coefficient for this collision.
   *
   * FRICTION COMBINATION:
   * We use geometric mean (square root of product).
   *
   * Why geometric mean?
   * - If either material has zero friction, result is zero (makes sense!)
   * - Similar materials give result close to their value
   * - Different materials blend smoothly
   *
   * Examples:
   * - Frictionless (0.0) + Rough (0.8) = 0.0 (one frictionless dominates)
   * - Smooth (0.3) + Rough (0.8) = 0.49 (blend)
   * - Both rough (0.8) + (0.8) = 0.8 (same as inputs)
   *
   * This is standard in physics engines (Box2D, Bullet, etc.)
   */
  private calculateFriction(): number {
    return Math.sqrt(this.bodyA.material.friction * this.bodyB.material.friction);
  }
}

import { Manifold } from './Manifold';
import { Contact } from './Contact';
import { EPSILON } from '../math/MathUtils';

/**
 * Resolves collisions using impulse-based resolution
 * Handles both velocity (impulse) and position correction
 */
export class CollisionResolver {
  // Configuration
  positionIterations: number = 8;
  velocityIterations: number = 10;
  positionSlop: number = 0.05; // Allowed penetration (above FP noise)
  positionCorrectionPercent: number = 0.8; // Baumgarte stabilization

  /**
   * Resolve all collision manifolds
   */
  resolve(manifolds: Manifold[], _dt: number): void {
    // Velocity resolution (impulse-based)
    for (let i = 0; i < this.velocityIterations; i++) {
      for (const manifold of manifolds) {
        this.resolveVelocity(manifold);
      }
    }

    // Position correction (prevent sinking)
    for (let i = 0; i < this.positionIterations; i++) {
      for (const manifold of manifolds) {
        this.resolvePosition(manifold);
      }
    }
  }

  /**
   * Resolve velocities using impulse method
   */
  private resolveVelocity(manifold: Manifold): void {
    const bodyA = manifold.bodyA;
    const bodyB = manifold.bodyB;

    for (const contact of manifold.contacts) {
      // Calculate relative velocity
      const relativeVelocity = bodyB.velocity.subtract(bodyA.velocity);

      // Velocity along the normal
      const velocityAlongNormal = relativeVelocity.dot(contact.normal);

      // Skip if velocities are separating (with epsilon tolerance)
      if (velocityAlongNormal > -EPSILON) {
        continue;
      }

      // Calculate impulse magnitude
      const invMassSum = bodyA.inverseMass + bodyB.inverseMass;

      // Both static - skip
      if (invMassSum < EPSILON) {
        continue;
      }

      // Impulse scalar
      const j = (-(1 + manifold.restitution) * velocityAlongNormal) / invMassSum;

      // Apply impulse
      const impulse = contact.normal.multiply(j);
      bodyA.velocity = bodyA.velocity.subtract(impulse.multiply(bodyA.inverseMass));
      bodyB.velocity = bodyB.velocity.add(impulse.multiply(bodyB.inverseMass));

      // Apply friction
      this.applyFriction(manifold, contact, j);
    }
  }

  /**
   * Apply friction impulse tangent to the collision normal
   */
  private applyFriction(manifold: Manifold, contact: Contact, normalImpulse: number): void {
    const bodyA = manifold.bodyA;
    const bodyB = manifold.bodyB;

    // Recalculate relative velocity after normal impulse
    const relativeVelocity = bodyB.velocity.subtract(bodyA.velocity);

    // Tangent vector (perpendicular to normal)
    const tangent = relativeVelocity.subtract(
      contact.normal.multiply(relativeVelocity.dot(contact.normal))
    );

    // Skip if tangent velocity is too small
    if (tangent.lengthSquared() < EPSILON * EPSILON) {
      return;
    }

    const tangentNormalized = tangent.normalize();

    // Calculate friction impulse magnitude
    const invMassSum = bodyA.inverseMass + bodyB.inverseMass;
    const jt = -relativeVelocity.dot(tangentNormalized) / invMassSum;

    // Coulomb's law: friction impulse can't exceed normal impulse * friction coefficient
    const maxFriction = Math.abs(normalImpulse) * manifold.friction;
    const frictionImpulse = Math.max(-maxFriction, Math.min(jt, maxFriction));

    // Apply friction impulse
    const frictionVector = tangentNormalized.multiply(frictionImpulse);
    bodyA.velocity = bodyA.velocity.subtract(frictionVector.multiply(bodyA.inverseMass));
    bodyB.velocity = bodyB.velocity.add(frictionVector.multiply(bodyB.inverseMass));
  }

  /**
   * Correct positions to prevent sinking (Baumgarte stabilization)
   */
  private resolvePosition(manifold: Manifold): void {
    const bodyA = manifold.bodyA;
    const bodyB = manifold.bodyB;

    for (const contact of manifold.contacts) {
      const invMassSum = bodyA.inverseMass + bodyB.inverseMass;

      // Both static - skip
      if (invMassSum < EPSILON) {
        continue;
      }

      // Calculate position correction
      const correction = Math.max(contact.penetration - this.positionSlop, 0);

      // Skip if correction is too small
      if (correction < EPSILON) {
        continue;
      }

      const correctionAmount = correction * this.positionCorrectionPercent;
      const correctionVector = contact.normal.multiply(correctionAmount);

      // Apply position correction proportional to inverse mass
      bodyA.position = bodyA.position.subtract(
        correctionVector.multiply(bodyA.inverseMass / invMassSum)
      );
      bodyB.position = bodyB.position.add(
        correctionVector.multiply(bodyB.inverseMass / invMassSum)
      );
    }
  }
}

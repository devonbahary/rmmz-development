import { Manifold } from './Manifold';
import { Contact } from './Contact';
import { EPSILON, EPSILON_SQ } from '../math/MathUtils';

/**
 * Resolves collisions using impulse-based physics.
 *
 * WHAT IS THIS?
 * When objects collide, we need to:
 * 1. Change their velocities (make them bounce/stop)
 * 2. Push them apart (prevent sinking into each other)
 *
 * This class handles both using a two-phase approach:
 * - Phase 1: Velocity resolution (impulse-based) - changes how fast objects move
 * - Phase 2: Position correction (projection) - physically separates overlapping objects
 */
export class CollisionResolver {
  // ===== CONFIGURATION =====

  /**
   * VELOCITY ITERATIONS: How many times to recalculate collision velocities.
   *
   * WHY? When you have multiple collisions (ball between two walls, or stacked boxes),
   * resolving one collision changes velocities, which affects other collisions.
   * We iterate multiple times until all collisions "converge" to a stable solution.
   *
   * Value: 8 (industry standard from Box2D)
   * - 1 iteration = fast but buggy with multiple collisions
   * - 8 iterations = stable, handles complex scenarios
   * - 20+ iterations = overkill, wastes CPU
   */
  velocityIterations: number = 6;

  /**
   * POSITION ITERATIONS: How many times to push apart overlapping objects.
   *
   * WHY? Similar to velocity - when you push apart box A from the ground,
   * it might still be overlapping with box B above it. Multiple iterations
   * let the whole stack gradually separate.
   *
   * Value: 4 (enough to resolve ~87% of penetration)
   * - 1 iteration = objects sink into each other
   * - 3 iterations = resolves ~79%
   * - 4 iterations = resolves ~87%, good balance
   * - 6+ iterations = can cause instability
   */
  positionIterations: number = 4;

  /**
   * POSITION SLOP: Small penetration we allow (in pixels).
   *
   * WHY? Floating-point math is imprecise. If we try to achieve PERFECT
   * separation (0.00000 penetration), objects will jitter as they oscillate
   * between "barely touching" and "barely penetrating." Allowing 0.02 pixels
   * of overlap is invisible and prevents jitter.
   *
   * Value: 0.02 pixels (about 1/50th of a pixel - invisible to human eye)
   */
  positionSlop: number = 0.01;

  /**
   * POSITION CORRECTION PERCENT: How much of the penetration to fix per iteration.
   *
   * WHY? If we fix 100% in one go, objects overshoot and oscillate.
   * By fixing only 40% per iteration, and doing 3 iterations, we gradually
   * converge to the correct position without overshooting.
   *
   * Value: 0.4 (40% per iteration)
   * - After 3 iterations: fixes ~79% total (60% × 60% × 60% = 21.6% remains)
   * - Remaining 21.6% is below slop threshold, so it's acceptable
   */
  positionCorrectionPercent: number = 0.8;

  /**
   * RESTING VELOCITY THRESHOLD: If relative velocity is below this, consider it "resting."
   *
   * WHY? When a ball lands on the ground, it should stop bouncing, not micro-bounce
   * forever. If the collision velocity is very small (< 0.5 units/sec), we treat
   * it as a resting contact and set restitution to 0 (no bounce).
   *
   * Value: 0.5 units per second
   */
  restingVelocityThreshold: number = 0.5;

  // ===== MAIN ENTRY POINT =====

  /**
   * Resolve all collision manifolds.
   *
   * WHAT'S A MANIFOLD?
   * A "manifold" is physics jargon for "all the information about one collision."
   * It contains:
   * - The two bodies colliding (bodyA, bodyB)
   * - Contact points (where they're touching)
   * - Collision normal (which direction to push apart)
   * - Penetration depth (how much they're overlapping)
   * - Material properties (friction, restitution/bounciness)
   *
   * Think of it as a "collision report" - one manifold per collision.
   *
   * @param manifolds - Array of all detected collisions this frame
   * @param _dt - Time step (not currently used, but kept for future enhancements)
   */
  resolve(manifolds: Manifold[], _dt: number): void {
    // PHASE 1: VELOCITY RESOLUTION
    // Change how fast objects are moving to simulate bounce/collision response.
    // We iterate multiple times because resolving one collision affects others.
    for (let i = 0; i < this.velocityIterations; i++) {
      for (const manifold of manifolds) {
        this.resolveVelocity(manifold);
      }
    }

    // PHASE 2: POSITION CORRECTION
    // Push apart objects that are overlapping to prevent sinking.
    // We iterate multiple times to handle stacked objects (box on box on ground).
    for (let i = 0; i < this.positionIterations; i++) {
      for (const manifold of manifolds) {
        this.resolvePosition(manifold);
      }
    }
  }

  // ===== PHASE 1: VELOCITY RESOLUTION =====

  /**
   * Resolve collision velocities using impulse method.
   *
   * WHAT'S AN IMPULSE?
   * An impulse is an instant change in velocity (like hitting a ball with a bat).
   * Instead of gradually applying force, we instantly change the velocity based
   * on the collision normal and material properties.
   *
   * HOW IT WORKS:
   * 1. Calculate how fast objects are moving toward each other
   * 2. Calculate an "impulse" (instant velocity change) to make them separate
   * 3. Apply impulse to both bodies (proportional to their mass)
   * 4. Apply friction (resistance to sliding)
   *
   * RESTITUTION (bounciness):
   * - 0.0 = perfectly inelastic (objects stick together, no bounce)
   * - 0.5 = moderate bounce (loses half the energy)
   * - 1.0 = perfectly elastic (perfect bounce, no energy loss)
   */
  private resolveVelocity(manifold: Manifold): void {
    const bodyA = manifold.bodyA;
    const bodyB = manifold.bodyB;
    const invMassSum = bodyA.inverseMass + bodyB.inverseMass;

    // Skip if both bodies are static (can't move)
    // inverseMass = 0 for static bodies, so sum = 0
    if (invMassSum < EPSILON) {
      return;
    }

    // Check for intentional movement collision (dynamic vs static)
    const isAStatic = bodyA.inverseMass < EPSILON;
    const isBStatic = bodyB.inverseMass < EPSILON;
    const isDynamicVsStatic = (isAStatic && !isBStatic) || (!isAStatic && isBStatic);

    // Process each contact point in the manifold
    // (Most collisions have 1-2 contact points)
    for (const contact of manifold.contacts) {
      // 1. Calculate relative velocity (how fast B is moving toward A)
      const relativeVelocity = bodyB.velocity.subtract(bodyA.velocity);

      // 2. Project relative velocity onto collision normal
      // This tells us how fast they're moving toward/away from each other
      // Negative = moving toward each other (collision!)
      // Positive = moving apart (already separating)
      const velocityAlongNormal = relativeVelocity.dot(contact.normal);

      // 3. Skip if bodies are already separating
      // No need to apply impulse if they're moving apart
      if (velocityAlongNormal > 0) {
        continue;
      }

      // 4. Determine effective restitution (handle resting contacts and intentional movement)
      let effectiveRestitution = manifold.restitution;

      // OVERRIDE restitution for intentional movement into static bodies
      // This prevents bounce when a character deliberately walks into a wall
      if (isDynamicVsStatic) {
        const movingBody = isAStatic ? bodyB : bodyA;
        const normalDirection = isAStatic ? 1 : -1;

        // Check if body has intentional movement
        if (movingBody.movementVector.lengthSquared() > EPSILON_SQ) {
          // Check if movement direction is INTO the collision
          const movementDotNormal = movingBody.movementVector.dot(contact.normal) * normalDirection;

          if (movementDotNormal < -EPSILON) {
            // Moving intentionally into wall - NO BOUNCE
            effectiveRestitution = 0;
          }
        }
      }

      // RESTING CONTACT: When objects are barely moving (like a box sitting on ground),
      // we don't want tiny bounces. Override restitution to 0 (no bounce).
      if (Math.abs(velocityAlongNormal) < this.restingVelocityThreshold) {
        effectiveRestitution = 0; // No bounce for resting objects
      }

      // 5. Calculate impulse magnitude using physics formula:
      // j = -(1 + e) * vN / (1/mA + 1/mB)
      //
      // WHERE:
      // - e = restitution (bounciness)
      // - vN = velocity along normal (how fast moving together)
      // - 1/mA + 1/mB = combined inverse mass
      //
      // WHAT (1 + e) DOES:
      // - e = 0 (inelastic): j = -vN (just stops relative motion)
      // - e = 0.5: j = -1.5 * vN (bounces with half energy)
      // - e = 1 (elastic): j = -2 * vN (perfect bounce, reverses velocity)
      const impulseMagnitude = -(1 + effectiveRestitution) * velocityAlongNormal / invMassSum;

      // 6. Apply impulse along collision normal
      // Impulse is a vector: magnitude * direction
      const impulse = contact.normal.multiply(impulseMagnitude);

      // Apply to body A (subtract because normal points from A to B)
      bodyA.velocity = bodyA.velocity.subtract(impulse.multiply(bodyA.inverseMass));

      // Apply to body B (add because it's in the direction of normal)
      bodyB.velocity = bodyB.velocity.add(impulse.multiply(bodyB.inverseMass));

      // 7. Apply friction (resistance to sliding along the surface)
      if (manifold.friction > EPSILON) {
        this.applyFriction(manifold, contact, impulseMagnitude);
      }
    }
  }

  // ===== FRICTION =====

  /**
   * Apply friction impulse tangent to the collision normal.
   *
   * WHAT'S COLLISION FRICTION?
   * When objects slide against each other (like a box sliding down a wall),
   * friction resists that sliding motion. This is separate from "movement friction"
   * (air resistance) which is already handled in Body.integrate().
   *
   * HOW IT WORKS:
   * 1. Find the tangent direction (perpendicular to collision normal)
   * 2. Calculate how fast objects are sliding along that tangent
   * 3. Apply friction impulse to slow down the sliding
   * 4. Friction is capped by Coulomb's law: can't exceed μ * normalForce
   *
   * COULOMB'S LAW:
   * Friction force is limited by the normal force (how hard objects are pressed together).
   * friction ≤ μ * normalImpulse
   *
   * This is why a heavy box is harder to slide than a light box - more normal force!
   */
  private applyFriction(manifold: Manifold, contact: Contact, normalImpulse: number): void {
    const bodyA = manifold.bodyA;
    const bodyB = manifold.bodyB;
    const invMassSum = bodyA.inverseMass + bodyB.inverseMass;

    // 1. Recalculate relative velocity (it changed after applying normal impulse)
    const relativeVelocity = bodyB.velocity.subtract(bodyA.velocity);

    // 2. Calculate tangent vector (perpendicular to collision normal)
    // We project out the normal component to get only the sliding component
    // tangent = relativeVelocity - (relativeVelocity projected onto normal)
    const tangent = relativeVelocity.subtract(
      contact.normal.multiply(relativeVelocity.dot(contact.normal))
    );

    // 3. Skip if tangent velocity is negligible (not sliding)
    if (tangent.lengthSquared() < EPSILON_SQ) {
      return;
    }

    // 4. Normalize tangent to get direction of sliding
    const tangentNormalized = tangent.normalize();

    // 5. Calculate friction impulse magnitude
    // Similar to normal impulse, but along tangent direction
    const tangentVelocity = relativeVelocity.dot(tangentNormalized);
    let frictionImpulse = -tangentVelocity / invMassSum;

    // 6. Apply Coulomb's law: friction can't exceed μ * normalForce
    // μ (mu) = friction coefficient (from materials)
    // normalForce ≈ normalImpulse (for our purposes)
    const maxFriction = Math.abs(normalImpulse) * manifold.friction;

    // Clamp friction impulse to maximum allowed by Coulomb's law
    frictionImpulse = Math.max(-maxFriction, Math.min(frictionImpulse, maxFriction));

    // 7. Apply friction impulse to both bodies
    const frictionVector = tangentNormalized.multiply(frictionImpulse);
    bodyA.velocity = bodyA.velocity.subtract(frictionVector.multiply(bodyA.inverseMass));
    bodyB.velocity = bodyB.velocity.add(frictionVector.multiply(bodyB.inverseMass));
  }

  // ===== PHASE 2: POSITION CORRECTION =====

  /**
   * Correct positions to prevent objects from sinking into each other.
   *
   * WHY DO WE NEED THIS?
   * Even with perfect velocity resolution, floating-point errors and high forces
   * can cause objects to slightly penetrate each other. Over time, this accumulates
   * and objects sink into the ground or each other.
   *
   * POSITION CORRECTION directly pushes them apart to maintain separation.
   *
   * HOW IT WORKS:
   * 1. Calculate how much objects are penetrating (overlapping)
   * 2. Push them apart along the collision normal
   * 3. Distribute the correction proportional to their masses
   *    (lighter objects move more, heavier objects move less)
   *
   * WHY NOT 100% CORRECTION?
   * If we fix all penetration at once, objects overshoot and oscillate.
   * By fixing only 40% per iteration (and doing 3 iterations), we gradually
   * converge without instability.
   */
  private resolvePosition(manifold: Manifold): void {
    const bodyA = manifold.bodyA;
    const bodyB = manifold.bodyB;
    const invMassSum = bodyA.inverseMass + bodyB.inverseMass;

    // Skip if both bodies are static (can't move)
    if (invMassSum < EPSILON) {
      return;
    }

    // Process each contact point
    for (const contact of manifold.contacts) {
      // 1. Calculate correction depth (with slop tolerance)
      // We allow a tiny bit of penetration (slop) to prevent jitter.
      // Only correct penetration beyond the slop threshold.
      const correctionDepth = Math.max(contact.penetration - this.positionSlop, 0);

      // 2. Skip if correction is negligible
      if (correctionDepth < EPSILON) {
        continue;
      }

      // 3. Calculate correction amount (partial correction per iteration)
      // Only fix 40% of the penetration this iteration.
      // After 3 iterations, we'll have fixed ~79% total (good enough!).
      const correctionAmount = correctionDepth * this.positionCorrectionPercent;
      const correctionVector = contact.normal.multiply(correctionAmount);

      // 4. Distribute correction proportional to inverse mass
      // Lighter objects (higher inverseMass) move more
      // Heavier objects (lower inverseMass) move less
      // Static objects (inverseMass = 0) don't move at all
      const correctionA = correctionVector.multiply(bodyA.inverseMass / invMassSum);
      const correctionB = correctionVector.multiply(bodyB.inverseMass / invMassSum);

      // 5. Apply position corrections in-place
      // We modify x, y directly to maintain reference to shape center
      // Body A moves opposite to normal (away from B)
      bodyA.position.x -= correctionA.x;
      bodyA.position.y -= correctionA.y;

      // Body B moves along normal (away from A)
      bodyB.position.x += correctionB.x;
      bodyB.position.y += correctionB.y;
    }
  }
}

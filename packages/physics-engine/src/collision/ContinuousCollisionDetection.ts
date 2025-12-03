import { Body } from '../physics/Body';
import { Vector } from '../math/Vector';
import { AABB } from '../geometry/AABB';
import { Circle } from '../geometry/Circle';
import { Rectangle } from '../geometry/Rectangle';
import { EPSILON } from '../math/MathUtils';

/**
 * Swept collision result containing time-of-impact and collision info
 */
export interface SweptResult {
  /** Time of impact [0, 1] where 0 = start of frame, 1 = end of frame */
  toi: number;

  /** Collision normal at point of impact */
  normal: Vector;

  /** Contact point at time of impact */
  point: Vector;
}

/**
 * Continuous Collision Detection (CCD) - prevents tunneling.
 *
 * WHAT'S TUNNELING?
 * When objects move very fast, they can "skip" through walls between frames:
 *
 * Frame 1:  |  O ->      |   (ball moving right very fast)
 * Frame 2:  |       O    |   (ball teleported through wall!)
 *
 * WHAT'S CCD?
 * Instead of just checking if objects overlap NOW, we check if they will
 * collide DURING the movement this frame. We "sweep" the shape along its
 * velocity vector to find when (if ever) it first touches another shape.
 *
 * HOW IT WORKS:
 * 1. Cast a ray from current position to next position (velocity * dt)
 * 2. Find the first time the shape touches another shape (time-of-impact)
 * 3. Move bodies to that exact moment
 * 4. Resolve the collision normally
 *
 * This ensures fast-moving objects never skip through walls!
 */
export class ContinuousCollisionDetection {
  /**
   * Check if a body needs swept collision detection.
   *
   * WHEN DO WE NEED CCD?
   * Only for fast-moving objects. If an object moves less than half its size
   * per frame, normal collision detection is fine. But if it moves faster,
   * it might tunnel.
   *
   * @param body - The body to check
   * @param dt - Time step (in seconds)
   * @returns true if body is moving fast enough to need CCD
   */
  static needsSweptTest(body: Body, dt: number): boolean {
    // Skip static bodies (they don't move)
    if (body.inverseMass < EPSILON) {
      return false;
    }

    // Calculate how far body will move this frame
    const displacement = body.velocity.length() * dt;

    // Get minimum dimension of body (smallest side)
    const aabb = body.getAABB();
    const minDimension = Math.min(
      aabb.max.x - aabb.min.x,
      aabb.max.y - aabb.min.y
    );

    // Need CCD if moving more than half the body size
    // (could tunnel through a wall thinner than the body)
    return displacement > minDimension * 0.5;
  }

  /**
   * Perform swept collision test between two bodies.
   *
   * WHAT THIS RETURNS:
   * - null = no collision during this frame's movement
   * - SweptResult = collision will happen at time 'toi' (0 to 1)
   *   - toi = 0.5 means collision happens halfway through the frame
   *   - toi = 0.0 means already touching at start of frame
   *   - toi = 1.0 means collision at very end of frame
   *
   * @param bodyA - First body (the one moving)
   * @param bodyB - Second body (can be moving or static)
   * @param dt - Time step
   * @returns Swept collision result or null
   */
  static checkSweptCollision(
    bodyA: Body,
    bodyB: Body,
    dt: number
  ): SweptResult | null {
    // Calculate relative velocity (how fast A moves relative to B)
    const relativeVelocity = bodyA.velocity.subtract(bodyB.velocity);

    // Skip if not moving toward each other
    if (relativeVelocity.lengthSquared() < EPSILON) {
      return null;
    }

    // Dispatch to shape-specific swept test
    const shapeA = bodyA.shape;
    const shapeB = bodyB.shape;

    if (shapeA.type === 'Circle' && shapeB.type === 'Circle') {
      return this.sweptCircleCircle(
        bodyA, bodyB, relativeVelocity, dt
      );
    } else if (shapeA.type === 'Circle' && shapeB.type === 'Rectangle') {
      return this.sweptCircleRect(
        bodyA, bodyB, relativeVelocity, dt
      );
    } else if (shapeA.type === 'Rectangle' && shapeB.type === 'Circle') {
      // Swap and flip normal
      const result = this.sweptCircleRect(
        bodyB, bodyA, relativeVelocity.multiply(-1), dt
      );
      if (result) {
        result.normal = result.normal.multiply(-1);
      }
      return result;
    } else if (shapeA.type === 'Rectangle' && shapeB.type === 'Rectangle') {
      return this.sweptRectRect(
        bodyA, bodyB, relativeVelocity, dt
      );
    }

    return null;
  }

  // ===== SWEPT CIRCLE vs CIRCLE =====

  /**
   * Swept test: Circle moving toward another circle.
   *
   * ALGORITHM:
   * Treat circle A as a point, expand circle B by radius A.
   * Ray cast from A's center to find when point enters expanded B.
   */
  private static sweptCircleCircle(
    circleA: Body,
    circleB: Body,
    relativeVelocity: Vector,
    dt: number
  ): SweptResult | null {
    const shapeA = circleA.shape as Circle;
    const shapeB = circleB.shape as Circle;

    // Combined radius (sum of both circles)
    const radiusSum = shapeA.radius + shapeB.radius;

    // Vector from B to A
    const centerDiff = circleA.position.subtract(circleB.position);

    // Quadratic equation coefficients for ray-sphere intersection
    // Ray: P(t) = centerDiff + relativeVelocity * t
    // Sphere: |P(t)|² = radiusSum²
    const a = relativeVelocity.dot(relativeVelocity);
    const b = 2 * centerDiff.dot(relativeVelocity);
    const c = centerDiff.dot(centerDiff) - radiusSum * radiusSum;

    const discriminant = b * b - 4 * a * c;

    // No intersection
    if (discriminant < 0) {
      return null;
    }

    // Find first intersection time
    const sqrtDisc = Math.sqrt(discriminant);
    let t = (-b - sqrtDisc) / (2 * a);

    // Clamp to [0, dt]
    if (t < 0 || t > dt) {
      return null;
    }

    // Calculate collision point and normal
    const contactPoint = circleA.position.add(relativeVelocity.multiply(t));
    const normal = contactPoint.subtract(circleB.position).normalize();

    return {
      toi: t / dt, // Normalize to [0, 1]
      normal,
      point: contactPoint,
    };
  }

  // ===== SWEPT CIRCLE vs RECTANGLE =====

  /**
   * Swept test: Circle moving toward rectangle.
   *
   * ALGORITHM:
   * Use Minkowski sum: expand rectangle by circle radius, treat circle as point.
   * Ray cast point against expanded rectangle.
   */
  private static sweptCircleRect(
    circle: Body,
    rect: Body,
    relativeVelocity: Vector,
    dt: number
  ): SweptResult | null {
    const circleShape = circle.shape as Circle;
    const rectShape = rect.shape as Rectangle;

    // Expand rectangle by circle radius (Minkowski sum)
    const expandedMin = rectShape.min.subtract(new Vector(circleShape.radius, circleShape.radius));
    const expandedMax = rectShape.max.add(new Vector(circleShape.radius, circleShape.radius));
    const expandedRect = new AABB(expandedMin, expandedMax);

    // Ray cast circle center against expanded rectangle
    const result = this.raycastAABB(
      circle.position,
      relativeVelocity,
      expandedRect,
      dt
    );

    return result;
  }

  // ===== SWEPT RECTANGLE vs RECTANGLE =====

  /**
   * Swept test: Rectangle moving toward another rectangle.
   *
   * ALGORITHM:
   * Use Minkowski difference: treat rect A as point, expand rect B by rect A's size.
   * Ray cast point against expanded rectangle.
   */
  private static sweptRectRect(
    rectA: Body,
    rectB: Body,
    relativeVelocity: Vector,
    dt: number
  ): SweptResult | null {
    const shapeA = rectA.shape as Rectangle;
    const shapeB = rectB.shape as Rectangle;

    // Calculate half-sizes
    const halfSizeA = new Vector(
      (shapeA.max.x - shapeA.min.x) / 2,
      (shapeA.max.y - shapeA.min.y) / 2
    );

    // Expand rect B by rect A's half-size (Minkowski sum)
    const expandedMin = shapeB.min.subtract(halfSizeA);
    const expandedMax = shapeB.max.add(halfSizeA);
    const expandedRect = new AABB(expandedMin, expandedMax);

    // Ray cast rect A's center against expanded rect B
    const result = this.raycastAABB(
      rectA.position,
      relativeVelocity,
      expandedRect,
      dt
    );

    return result;
  }

  // ===== RAYCAST HELPER =====

  /**
   * Ray cast against an AABB (axis-aligned bounding box).
   *
   * WHAT'S A RAYCAST?
   * A ray is a line starting at a point and going in a direction.
   * We want to find WHERE (if anywhere) the ray intersects the AABB.
   *
   * ALGORITHM (Slab method):
   * An AABB is the intersection of 2 slabs (x-slab and y-slab).
   * Find where ray enters/exits each slab, then find the overlap.
   *
   * @param origin - Ray starting point
   * @param direction - Ray direction (velocity)
   * @param aabb - Target AABB
   * @param maxT - Maximum time to check (dt)
   * @returns Swept result or null
   */
  private static raycastAABB(
    origin: Vector,
    direction: Vector,
    aabb: AABB,
    maxT: number
  ): SweptResult | null {
    // Time when ray enters/exits each slab
    let tMin = 0;
    let tMax = maxT;

    // Normal of the surface we hit
    let hitNormal = new Vector(0, 0);

    // Check X slab
    if (Math.abs(direction.x) > EPSILON) {
      const tx1 = (aabb.min.x - origin.x) / direction.x;
      const tx2 = (aabb.max.x - origin.x) / direction.x;

      const txMin = Math.min(tx1, tx2);
      const txMax = Math.max(tx1, tx2);

      if (txMin > tMin) {
        tMin = txMin;
        hitNormal = direction.x > 0 ? new Vector(-1, 0) : new Vector(1, 0);
      }
      tMax = Math.min(tMax, txMax);
    } else {
      // Ray parallel to X slab - check if inside
      if (origin.x < aabb.min.x || origin.x > aabb.max.x) {
        return null;
      }
    }

    // Check Y slab
    if (Math.abs(direction.y) > EPSILON) {
      const ty1 = (aabb.min.y - origin.y) / direction.y;
      const ty2 = (aabb.max.y - origin.y) / direction.y;

      const tyMin = Math.min(ty1, ty2);
      const tyMax = Math.max(ty1, ty2);

      if (tyMin > tMin) {
        tMin = tyMin;
        hitNormal = direction.y > 0 ? new Vector(0, -1) : new Vector(0, 1);
      }
      tMax = Math.min(tMax, tyMax);
    } else {
      // Ray parallel to Y slab - check if inside
      if (origin.y < aabb.min.y || origin.y > aabb.max.y) {
        return null;
      }
    }

    // No intersection if tMin > tMax
    if (tMin > tMax) {
      return null;
    }

    // No intersection if entirely behind ray
    if (tMax < 0) {
      return null;
    }

    // No intersection if beyond max time
    if (tMin > maxT) {
      return null;
    }

    // Collision at tMin
    const contactPoint = origin.add(direction.multiply(tMin));

    return {
      toi: tMin / maxT, // Normalize to [0, 1]
      normal: hitNormal,
      point: contactPoint,
    };
  }
}

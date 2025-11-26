import { Body } from '../../physics/Body';
import { Circle } from '../../geometry/Circle';
import { Rectangle } from '../../geometry/Rectangle';
import { Manifold } from '../Manifold';
import { Contact } from '../Contact';
import { Vector } from '../../math/Vector';
import { EPSILON, clamp } from '../../math/MathUtils';

/**
 * Detect collision between a circle and a rectangle
 */
export function detectCircleRectangle(bodyA: Body, bodyB: Body): Manifold | null {
  const circle = bodyA.shape as Circle;
  const rect = bodyB.shape as Rectangle;

  // Find closest point on rectangle to circle center
  const closest = new Vector(
    clamp(bodyA.position.x, rect.min.x, rect.max.x),
    clamp(bodyA.position.y, rect.min.y, rect.max.y)
  );

  // Calculate distance from circle center to closest point
  const offset = bodyA.position.subtract(closest);
  const distSq = offset.lengthSquared();
  const radiusSq = circle.radius * circle.radius;

  // No collision if distance > radius
  if (distSq > radiusSq + EPSILON) {
    return null;
  }

  const manifold = new Manifold(bodyA, bodyB);

  const distance = Math.sqrt(distSq);

  // Handle circle center inside rectangle
  if (distance < EPSILON) {
    // Find closest edge
    const distToLeft = bodyA.position.x - rect.min.x;
    const distToRight = rect.max.x - bodyA.position.x;
    const distToTop = bodyA.position.y - rect.min.y;
    const distToBottom = rect.max.y - bodyA.position.y;

    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    let normal: Vector;
    let penetration: number;

    if (minDist === distToLeft) {
      normal = new Vector(-1, 0);
      penetration = circle.radius + distToLeft;
    } else if (minDist === distToRight) {
      normal = new Vector(1, 0);
      penetration = circle.radius + distToRight;
    } else if (minDist === distToTop) {
      normal = new Vector(0, -1);
      penetration = circle.radius + distToTop;
    } else {
      normal = new Vector(0, 1);
      penetration = circle.radius + distToBottom;
    }

    const contactPoint = bodyA.position.subtract(normal.multiply(circle.radius));
    const contact = new Contact(contactPoint, normal, penetration);
    manifold.addContact(contact);
    return manifold;
  }

  // Normal points from rectangle to circle
  const normal = offset.divide(distance);

  // Penetration depth
  const penetration = circle.radius - distance;

  // Contact point on circle surface
  const contactPoint = bodyA.position.subtract(normal.multiply(circle.radius));

  const contact = new Contact(contactPoint, normal, penetration);
  manifold.addContact(contact);

  return manifold;
}

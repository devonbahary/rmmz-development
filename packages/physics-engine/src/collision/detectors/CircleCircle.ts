import { Body } from '../../physics/Body';
import { Circle } from '../../geometry/Circle';
import { Manifold } from '../Manifold';
import { Contact } from '../Contact';
import { Vector } from '../../math/Vector';
import { EPSILON } from '../../math/MathUtils';
import { testCircleCircleOverlap } from '../ShapeOverlap';

/**
 * Detect collision between two circles
 */
export function detectCircleCircle(bodyA: Body, bodyB: Body): Manifold | null {
  const circleA = bodyA.shape as Circle;
  const circleB = bodyB.shape as Circle;

  // Use shared overlap test (REUSE!)
  if (!testCircleCircleOverlap(circleA, circleB)) {
    return null;
  }

  // Calculate distance for normal/penetration calculation
  const distSq = bodyA.position.distanceSquared(bodyB.position);
  const radiusSum = circleA.radius + circleB.radius;

  const manifold = new Manifold(bodyA, bodyB);

  // Handle perfectly overlapping circles (distance ~ 0)
  const distance = Math.sqrt(distSq);
  if (distance < EPSILON) {
    // Use arbitrary separation direction
    const normal = new Vector(1, 0);
    const contactPoint = bodyA.position.clone();
    const contact = new Contact(contactPoint, normal, radiusSum);
    manifold.addContact(contact);
    return manifold;
  }

  // Normal from A to B
  const normal = bodyB.position.subtract(bodyA.position).divide(distance);

  // Penetration depth
  const penetration = radiusSum - distance;

  // Contact point is on the line between centers, at circleA's surface
  const contactPoint = bodyA.position.add(normal.multiply(circleA.radius));

  const contact = new Contact(contactPoint, normal, penetration);
  manifold.addContact(contact);

  return manifold;
}

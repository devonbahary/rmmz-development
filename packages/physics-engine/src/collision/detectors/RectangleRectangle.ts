import { Body } from '../../physics/Body';
import { Rectangle } from '../../geometry/Rectangle';
import { Manifold } from '../Manifold';
import { Contact } from '../Contact';
import { Vector } from '../../math/Vector';
import { testRectangleRectangleOverlap } from '../ShapeOverlap';

/**
 * Detect collision between two axis-aligned rectangles
 */
export function detectRectangleRectangle(bodyA: Body, bodyB: Body): Manifold | null {
  const rectA = bodyA.shape as Rectangle;
  const rectB = bodyB.shape as Rectangle;

  // Use shared overlap test (REUSE!)
  if (!testRectangleRectangleOverlap(rectA, rectB)) {
    return null;
  }

  // Calculate overlap on each axis (for penetration calculation)
  const overlapX = Math.min(rectA.max.x, rectB.max.x) - Math.max(rectA.min.x, rectB.min.x);
  const overlapY = Math.min(rectA.max.y, rectB.max.y) - Math.max(rectA.min.y, rectB.min.y);

  const manifold = new Manifold(bodyA, bodyB);

  // Find minimum penetration axis
  let normal: Vector;
  let penetration: number;

  if (overlapX < overlapY) {
    // Separate on X axis
    penetration = overlapX;
    // Determine direction based on centers
    if (bodyB.position.x > bodyA.position.x) {
      normal = new Vector(1, 0); // B is to the right of A
    } else {
      normal = new Vector(-1, 0); // B is to the left of A
    }
  } else {
    // Separate on Y axis
    penetration = overlapY;
    // Determine direction based on centers
    if (bodyB.position.y > bodyA.position.y) {
      normal = new Vector(0, 1); // B is below A
    } else {
      normal = new Vector(0, -1); // B is above A
    }
  }

  // Calculate contact point (center of overlap region)
  const contactX = (Math.max(rectA.min.x, rectB.min.x) + Math.min(rectA.max.x, rectB.max.x)) / 2;
  const contactY = (Math.max(rectA.min.y, rectB.min.y) + Math.min(rectA.max.y, rectB.max.y)) / 2;
  const contactPoint = new Vector(contactX, contactY);

  const contact = new Contact(contactPoint, normal, penetration);
  manifold.addContact(contact);

  return manifold;
}

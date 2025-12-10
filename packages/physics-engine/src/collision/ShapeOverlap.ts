import { Shape, ShapeType } from '../geometry/Shape';
import { Circle } from '../geometry/Circle';
import { Rectangle } from '../geometry/Rectangle';
import { Vector } from '../math/Vector';
import { EPSILON, EPSILON_SQ, clamp } from '../math/MathUtils';

/**
 * Test if two shapes overlap (pure geometry, no physics properties)
 * @param shapeA - First shape
 * @param shapeB - Second shape
 * @returns true if shapes overlap, false otherwise
 */
export function testShapeOverlap(shapeA: Shape, shapeB: Shape): boolean {
  const typeA = shapeA.type;
  const typeB = shapeB.type;

  if (typeA === ShapeType.Circle && typeB === ShapeType.Circle) {
    return testCircleCircleOverlap(shapeA as Circle, shapeB as Circle);
  } else if (typeA === ShapeType.Circle && typeB === ShapeType.Rectangle) {
    return testCircleRectangleOverlap(shapeA as Circle, shapeB as Rectangle);
  } else if (typeA === ShapeType.Rectangle && typeB === ShapeType.Circle) {
    return testCircleRectangleOverlap(shapeB as Circle, shapeA as Rectangle);
  } else if (typeA === ShapeType.Rectangle && typeB === ShapeType.Rectangle) {
    return testRectangleRectangleOverlap(shapeA as Rectangle, shapeB as Rectangle);
  }

  return false;
}

export function testCircleCircleOverlap(circleA: Circle, circleB: Circle): boolean {
  const distSq = circleA.center.distanceSquared(circleB.center);
  const radiusSum = circleA.radius + circleB.radius;
  return distSq < radiusSum * radiusSum + EPSILON_SQ;
}

export function testCircleRectangleOverlap(circle: Circle, rect: Rectangle): boolean {
  const closest = new Vector(
    clamp(circle.center.x, rect.min.x, rect.max.x),
    clamp(circle.center.y, rect.min.y, rect.max.y)
  );
  const distSq = circle.center.distanceSquared(closest);
  return distSq <= circle.radius * circle.radius + EPSILON_SQ;
}

export function testRectangleRectangleOverlap(rectA: Rectangle, rectB: Rectangle): boolean {
  const overlapX = Math.min(rectA.max.x, rectB.max.x) - Math.max(rectA.min.x, rectB.min.x);
  const overlapY = Math.min(rectA.max.y, rectB.max.y) - Math.max(rectA.min.y, rectB.min.y);
  return overlapX > EPSILON && overlapY > EPSILON;
}

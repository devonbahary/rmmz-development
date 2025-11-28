import { Vector } from '../math/Vector';
import { AABB } from './AABB';
import { Shape, ShapeType } from './Shape';
import { EPSILON_SQ } from '../math/MathUtils';

/**
 * Circle shape
 */
export class Circle extends Shape {
  readonly type = ShapeType.Circle;

  constructor(
    public center: Vector,
    public radius: number
  ) {
    super();
  }

  getAABB(): AABB {
    return new AABB(
      new Vector(this.center.x - this.radius, this.center.y - this.radius),
      new Vector(this.center.x + this.radius, this.center.y + this.radius)
    );
  }

  contains(point: Vector): boolean {
    const distSq = this.center.distanceSquared(point);
    return distSq <= this.radius * this.radius + EPSILON_SQ;
  }

  getCenter(): Vector {
    return this.center.clone();
  }

  getArea(): number {
    return Math.PI * this.radius * this.radius;
  }

  overlaps(other: Shape): boolean {
    if (other.type === ShapeType.Circle) {
      const otherCircle = other as Circle;
      const distSq = this.center.distanceSquared(otherCircle.center);
      const radiusSum = this.radius + otherCircle.radius;
      return distSq < radiusSum * radiusSum;
    } else {
      // Rectangle - use Rectangle's logic
      return other.overlaps(this);
    }
  }
}

import { Vector } from '../math/Vector';
import { AABB } from './AABB';
import { Shape, ShapeType } from './Shape';
import { Circle } from './Circle';
import { EPSILON, EPSILON_SQ, clamp } from '../math/MathUtils';

/**
 * Axis-Aligned Bounding Box Rectangle
 * No rotation support - AABBs only
 */
export class Rectangle extends Shape {
  readonly type = ShapeType.Rectangle;

  constructor(
    public min: Vector,
    public max: Vector
  ) {
    super();
  }

  /**
   * Create a rectangle from center point and dimensions
   */
  static fromCenter(center: Vector, width: number, height: number): Rectangle {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    return new Rectangle(
      new Vector(center.x - halfWidth, center.y - halfHeight),
      new Vector(center.x + halfWidth, center.y + halfHeight)
    );
  }

  get width(): number {
    return this.max.x - this.min.x;
  }

  get height(): number {
    return this.max.y - this.min.y;
  }

  getAABB(): AABB {
    return new AABB(this.min.clone(), this.max.clone());
  }

  contains(point: Vector): boolean {
    return (
      point.x >= this.min.x - EPSILON &&
      point.x <= this.max.x + EPSILON &&
      point.y >= this.min.y - EPSILON &&
      point.y <= this.max.y + EPSILON
    );
  }

  getCenter(): Vector {
    return new Vector((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2);
  }

  getArea(): number {
    return this.width * this.height;
  }

  overlaps(other: Shape): boolean {
    if (other.type === ShapeType.Rectangle) {
      const otherRect = other as Rectangle;
      return (
        this.min.x < otherRect.max.x &&
        this.max.x > otherRect.min.x &&
        this.min.y < otherRect.max.y &&
        this.max.y > otherRect.min.y
      );
    } else if (other.type === ShapeType.Circle) {
      const circle = other as Circle;
      // Find closest point on rectangle to circle center
      const closest = new Vector(
        clamp(circle.center.x, this.min.x, this.max.x),
        clamp(circle.center.y, this.min.y, this.max.y)
      );
      const distSq = circle.center.distanceSquared(closest);
      return distSq < circle.radius * circle.radius + EPSILON_SQ;
    }
    return false;
  }

  /**
   * Get the four corners of this rectangle
   */
  getCorners(): Vector[] {
    return [
      new Vector(this.min.x, this.min.y),
      new Vector(this.max.x, this.min.y),
      new Vector(this.max.x, this.max.y),
      new Vector(this.min.x, this.max.y),
    ];
  }
}

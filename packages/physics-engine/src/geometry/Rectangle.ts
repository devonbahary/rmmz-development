import { Vector } from '../math/Vector';
import { AABB } from './AABB';
import { Shape, ShapeType } from './Shape';
import { Circle } from './Circle';
import { EPSILON, EPSILON_SQ, clamp } from '../math/MathUtils';

/**
 * Axis-Aligned Bounding Box Rectangle
 * No rotation support - AABBs only
 *
 * Internally stores center and dimensions as source of truth.
 * min/max are computed properties derived from center.
 */
export class Rectangle extends Shape {
  readonly type = ShapeType.Rectangle;

  // Center is the source of truth for position
  public center: Vector;
  private _width: number;
  private _height: number;

  constructor(min: Vector, max: Vector) {
    super();
    // Compute center and dimensions from min/max
    this._width = max.x - min.x;
    this._height = max.y - min.y;
    this.center = new Vector(
      min.x + this._width / 2,
      min.y + this._height / 2
    );
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

  // min and max are computed from center (source of truth)
  get min(): Vector {
    return new Vector(
      this.center.x - this._width / 2,
      this.center.y - this._height / 2
    );
  }

  get max(): Vector {
    return new Vector(
      this.center.x + this._width / 2,
      this.center.y + this._height / 2
    );
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
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
    return this.center;
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

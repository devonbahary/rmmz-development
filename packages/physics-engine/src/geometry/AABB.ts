import { Vector } from '../math/Vector';

/**
 * Axis-Aligned Bounding Box
 * Used for broad-phase collision detection
 */
export class AABB {
  constructor(
    public min: Vector,
    public max: Vector
  ) {}

  static fromCenterAndSize(center: Vector, width: number, height: number): AABB {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    return new AABB(
      new Vector(center.x - halfWidth, center.y - halfHeight),
      new Vector(center.x + halfWidth, center.y + halfHeight)
    );
  }

  getCenter(): Vector {
    return new Vector((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2);
  }

  getWidth(): number {
    return this.max.x - this.min.x;
  }

  getHeight(): number {
    return this.max.y - this.min.y;
  }

  /**
   * Check if this AABB overlaps with another
   */
  overlaps(other: AABB): boolean {
    return (
      this.min.x < other.max.x &&
      this.max.x > other.min.x &&
      this.min.y < other.max.y &&
      this.max.y > other.min.y
    );
  }

  /**
   * Check if this AABB contains a point
   */
  contains(point: Vector): boolean {
    return (
      point.x >= this.min.x &&
      point.x <= this.max.x &&
      point.y >= this.min.y &&
      point.y <= this.max.y
    );
  }

  /**
   * Expand this AABB to include another AABB
   */
  merge(other: AABB): AABB {
    return new AABB(
      new Vector(Math.min(this.min.x, other.min.x), Math.min(this.min.y, other.min.y)),
      new Vector(Math.max(this.max.x, other.max.x), Math.max(this.max.y, other.max.y))
    );
  }

  clone(): AABB {
    return new AABB(this.min.clone(), this.max.clone());
  }
}

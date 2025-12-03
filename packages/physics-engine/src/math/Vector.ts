import { EPSILON, EPSILON_SQ, approxZero } from './MathUtils';

/**
 * 2D Vector class with floating-point safe operations
 * Provides both immutable and mutable operations for performance
 */
export class Vector {
  constructor(
    public x: number,
    public y: number
  ) {}

  // ===== Static Factories =====

  static zero(): Vector {
    return new Vector(0, 0);
  }

  // ===== Immutable Operations =====

  clone(): Vector {
    return new Vector(this.x, this.y);
  }

  add(v: Vector): Vector {
    return new Vector(this.x + v.x, this.y + v.y);
  }

  subtract(v: Vector): Vector {
    return new Vector(this.x - v.x, this.y - v.y);
  }

  multiply(scalar: number): Vector {
    return new Vector(this.x * scalar, this.y * scalar);
  }

  divide(scalar: number): Vector {
    // Guard against division by near-zero
    if (approxZero(scalar)) {
      return Vector.zero();
    }
    return new Vector(this.x / scalar, this.y / scalar);
  }

  // ===== Mutable Operations (for performance) =====

  addMut(v: Vector): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  subtractMut(v: Vector): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  multiplyMut(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  divideMut(scalar: number): this {
    // Guard against division by near-zero
    if (approxZero(scalar)) {
      this.x = 0;
      this.y = 0;
      return this;
    }
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }

  // ===== Vector Operations =====

  dot(v: Vector): number {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * Cross product in 2D returns a scalar (z-component of 3D cross product)
   * Useful for determining rotation direction and calculating torque
   */
  cross(v: Vector): number {
    return this.x * v.y - this.y * v.x;
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  length(): number {
    return Math.sqrt(this.lengthSquared());
  }

  /**
   * Normalize the vector (returns new vector)
   * Returns zero vector if length is too small to avoid division errors
   */
  normalize(): Vector {
    const lenSq = this.lengthSquared();
    if (lenSq < EPSILON_SQ) {
      return Vector.zero();
    }
    const len = Math.sqrt(lenSq);
    return new Vector(this.x / len, this.y / len);
  }

  /**
   * Normalize this vector in place
   * Sets to zero if length is too small
   */
  normalizeMut(): this {
    const lenSq = this.lengthSquared();
    if (lenSq < EPSILON_SQ) {
      this.x = 0;
      this.y = 0;
      return this;
    }
    const len = Math.sqrt(lenSq);
    this.x /= len;
    this.y /= len;
    return this;
  }

  distance(v: Vector): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  distanceSquared(v: Vector): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  // ===== Geometric Operations =====

  /**
   * Get the angle of this vector in radians
   */
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Rotate vector by angle (radians)
   */
  rotate(angle: number): Vector {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
  }

  /**
   * Rotate vector in place by angle (radians)
   */
  rotateMut(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const newX = this.x * cos - this.y * sin;
    const newY = this.x * sin + this.y * cos;
    this.x = newX;
    this.y = newY;
    return this;
  }

  /**
   * Get perpendicular vector (rotated 90 degrees counter-clockwise)
   */
  perpendicular(): Vector {
    return new Vector(-this.y, this.x);
  }

  /**
   * Project this vector onto another vector
   */
  project(onto: Vector): Vector {
    const ontoLenSq = onto.lengthSquared();
    if (ontoLenSq < EPSILON_SQ) {
      return Vector.zero();
    }
    const scalar = this.dot(onto) / ontoLenSq;
    return onto.multiply(scalar);
  }

  /**
   * Reflect this vector across a normal
   */
  reflect(normal: Vector): Vector {
    const dotProduct = this.dot(normal);
    return this.subtract(normal.multiply(2 * dotProduct));
  }

  /**
   * Linear interpolation between this vector and another
   * @param v Target vector
   * @param t Interpolation factor (0-1)
   */
  lerp(v: Vector, t: number): Vector {
    return new Vector(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t);
  }

  // ===== Utility =====

  /**
   * Check if vector is approximately zero
   */
  isZero(): boolean {
    return this.lengthSquared() < EPSILON_SQ;
  }

  /**
   * Check if this vector equals another within epsilon tolerance
   */
  equals(v: Vector, epsilon = EPSILON): boolean {
    return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
  }

  toString(): string {
    return `Vector(${this.x.toFixed(3)}, ${this.y.toFixed(3)})`;
  }
}

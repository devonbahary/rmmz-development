import { Vector } from '../math/Vector';
import { AABB } from './AABB';

/**
 * Shape types supported by the physics engine
 */
export enum ShapeType {
  Circle = 'Circle',
  Rectangle = 'Rectangle',
}

/**
 * Abstract base class for all shapes
 * Shapes are pure geometry - no physics properties
 * Can be used independently for spatial queries, area effects, triggers, etc.
 */
export abstract class Shape {
  abstract readonly type: ShapeType;

  /**
   * Get axis-aligned bounding box for this shape
   */
  abstract getAABB(): AABB;

  /**
   * Check if a point is contained within this shape
   * Uses epsilon tolerance for boundary checks
   */
  abstract contains(point: Vector): boolean;

  /**
   * Check if this shape overlaps with another shape
   * This allows shapes to be used for area queries without physics bodies
   */
  abstract overlaps(other: Shape): boolean;

  /**
   * Get the center point of this shape
   */
  abstract getCenter(): Vector;

  /**
   * Get the area of this shape
   */
  abstract getArea(): number;
}

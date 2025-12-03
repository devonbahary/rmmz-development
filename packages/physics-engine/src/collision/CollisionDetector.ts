import { Body } from '../physics/Body';
import { ShapeType } from '../geometry/Shape';
import { Manifold } from './Manifold';
import { detectCircleCircle } from './detectors/CircleCircle';
import { detectCircleRectangle } from './detectors/CircleRectangle';
import { detectRectangleRectangle } from './detectors/RectangleRectangle';

type CollisionFunction = (bodyA: Body, bodyB: Body) => Manifold | null;

/**
 * Dispatcher for narrow-phase collision detection
 * Routes to appropriate detector based on shape types
 */
export class CollisionDetector {
  private detectors: Map<string, CollisionFunction>;

  constructor() {
    this.detectors = new Map();
    this.registerDetectors();
  }

  /**
   * Detect collision between two bodies
   * Returns manifold if collision detected, null otherwise
   */
  detect(bodyA: Body, bodyB: Body): Manifold | null {
    const key = this.getDetectorKey(bodyA.shape.type, bodyB.shape.type);
    const detector = this.detectors.get(key);

    if (!detector) {
      console.warn(`No collision detector for ${bodyA.shape.type} vs ${bodyB.shape.type}`);
      return null;
    }

    return detector(bodyA, bodyB);
  }

  /**
   * Register all collision detection functions
   */
  private registerDetectors(): void {
    // Circle vs Circle
    this.detectors.set(
      this.getDetectorKey(ShapeType.Circle, ShapeType.Circle),
      detectCircleCircle
    );

    // Circle vs Rectangle (flip normal to maintain A→B convention)
    this.detectors.set(
      this.getDetectorKey(ShapeType.Circle, ShapeType.Rectangle),
      (bodyA, bodyB) => {
        const manifold = detectCircleRectangle(bodyA, bodyB);
        if (manifold) {
          // detectCircleRectangle produces normal pointing rect→circle (B→A)
          // Flip it to point circle→rect (A→B) to match convention
          const correctedManifold = new Manifold(bodyA, bodyB);
          manifold.contacts.forEach((contact) => {
            correctedManifold.addContact({
              point: contact.point,
              normal: contact.normal.multiply(-1), // Flip normal
              penetration: contact.penetration,
            });
          });
          return correctedManifold;
        }
        return null;
      }
    );

    // Rectangle vs Circle (swap bodies)
    this.detectors.set(
      this.getDetectorKey(ShapeType.Rectangle, ShapeType.Circle),
      (bodyA, bodyB) => {
        const manifold = detectCircleRectangle(bodyB, bodyA);
        if (manifold) {
          // Swap bodies but keep normal direction (already points from rect to circle = A→B)
          const reversedManifold = new Manifold(bodyA, bodyB);
          manifold.contacts.forEach((contact) => {
            reversedManifold.addContact({
              point: contact.point,
              normal: contact.normal, // Don't flip - already points A→B (rect→circle)
              penetration: contact.penetration,
            });
          });
          return reversedManifold;
        }
        return null;
      }
    );

    // Rectangle vs Rectangle
    this.detectors.set(
      this.getDetectorKey(ShapeType.Rectangle, ShapeType.Rectangle),
      detectRectangleRectangle
    );
  }

  /**
   * Generate unique key for shape type pair
   */
  private getDetectorKey(typeA: ShapeType, typeB: ShapeType): string {
    return `${typeA}_${typeB}`;
  }
}

import { Vector } from '../math/Vector';
import { Shape } from '../geometry/Shape';
import { AABB } from '../geometry/AABB';
import { Material } from './Material';
import { EPSILON, EPSILON_SQ } from '../math/MathUtils';

/**
 * Body type determines how the body behaves in the physics simulation
 */
export enum BodyType {
  /** Immovable, infinite mass - for walls, ground, etc. */
  Static = 'Static',
  /** Fully simulated with forces and collisions */
  Dynamic = 'Dynamic',
  /** Movable but not affected by forces (controlled externally) */
  Kinematic = 'Kinematic',
}

let bodyIdCounter = 0;

/**
 * Rigid body that combines a shape with physics properties
 * Bodies add physics behavior to pure geometric shapes
 */
export class Body {
  readonly id: string;

  // Kinematic state
  position: Vector;
  velocity: Vector;
  acceleration: Vector;

  // Dynamic properties
  mass: number;
  inverseMass: number; // Cached for performance
  inertia: number; // For future use if rotation is added
  inverseInertia: number;

  // Force accumulation
  private forceAccumulator: Vector;

  // Collision properties
  isSensor: boolean; // Detects collisions but doesn't resolve them
  layer: number; // Collision layer bitmask
  mask: number; // Collision mask bitmask

  // User data
  userData: unknown;

  constructor(
    public shape: Shape,
    public bodyType: BodyType,
    public material: Material = Material.DEFAULT
  ) {
    this.id = `body_${bodyIdCounter++}`;

    this.position = shape.getCenter();
    this.velocity = Vector.zero();
    this.acceleration = Vector.zero();

    this.forceAccumulator = Vector.zero();

    this.isSensor = false;
    this.layer = 1; // Default layer
    this.mask = 0xffffffff; // Collides with all layers by default

    this.userData = null;

    // Initialize mass
    if (bodyType === BodyType.Static) {
      this.mass = Infinity;
      this.inverseMass = 0;
      this.inertia = Infinity;
      this.inverseInertia = 0;
    } else {
      // Calculate mass from shape area and material density
      const area = shape.getArea();
      this.mass = area * material.density;
      this.inverseMass = this.mass > EPSILON ? 1 / this.mass : 0;

      // Calculate inertia (moment of inertia for uniform density)
      // For AABBs and circles, using simplified approximation
      this.inertia = (this.mass * area) / 12;
      this.inverseInertia = this.inertia > EPSILON ? 1 / this.inertia : 0;
    }
  }

  // ===== Mass Management =====

  setMass(mass: number): void {
    if (this.bodyType === BodyType.Static) {
      return; // Static bodies always have infinite mass
    }
    this.mass = mass;
    this.inverseMass = mass > EPSILON ? 1 / mass : 0;

    // Recalculate inertia
    const area = this.shape.getArea();
    this.inertia = (mass * area) / 12;
    this.inverseInertia = this.inertia > EPSILON ? 1 / this.inertia : 0;
  }

  setDensity(density: number): void {
    this.material.density = density;
    const area = this.shape.getArea();
    this.setMass(area * density);
  }

  // ===== Force Application =====

  /**
   * Apply a force to the body (accumulated until clearForces)
   */
  applyForce(force: Vector): void {
    if (this.bodyType !== BodyType.Dynamic) {
      return;
    }
    this.forceAccumulator.addMut(force);
  }

  /**
   * Apply an immediate velocity change (impulse)
   */
  applyImpulse(impulse: Vector): void {
    if (this.bodyType !== BodyType.Dynamic) {
      return;
    }
    this.velocity.addMut(impulse.multiply(this.inverseMass));
  }

  /**
   * Clear accumulated forces (called after integration)
   */
  clearForces(): void {
    this.forceAccumulator.x = 0;
    this.forceAccumulator.y = 0;
  }

  // ===== Integration =====

  /**
   * Integrate physics (Semi-implicit Euler with floating-point guards)
   * Called by the physics world during simulation step
   */
  integrate(dt: number, gravity: Vector): void {
    if (this.bodyType !== BodyType.Dynamic) {
      return;
    }

    // Calculate acceleration: a = F/m + g
    const accel = this.forceAccumulator.multiply(this.inverseMass).add(gravity);

    // Update velocity: v = v + a * dt
    this.velocity.addMut(accel.multiply(dt));

    // Clamp very small velocities to zero to prevent floating-point drift
    if (this.velocity.lengthSquared() < EPSILON_SQ) {
      this.velocity.x = 0;
      this.velocity.y = 0;
    }

    // Update position: x = x + v * dt
    this.position.addMut(this.velocity.multiply(dt));
  }

  // ===== Queries =====

  getAABB(): AABB {
    return this.shape.getAABB();
  }

  getKineticEnergy(): number {
    if (this.bodyType !== BodyType.Dynamic) {
      return 0;
    }
    return 0.5 * this.mass * this.velocity.lengthSquared();
  }

  /**
   * Check if this body can collide with another based on layer/mask filtering
   */
  canCollideWith(other: Body): boolean {
    // Sensors don't resolve collisions
    if (this.isSensor || other.isSensor) {
      return false;
    }

    // Layer/mask filtering
    return !!(this.mask & other.layer && other.mask & this.layer);
  }

  // ===== Setters =====

  setPosition(position: Vector): void {
    this.position = position.clone();
  }

  setVelocity(velocity: Vector): void {
    this.velocity = velocity.clone();
  }
}

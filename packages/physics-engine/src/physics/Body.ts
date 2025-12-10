import { Vector } from '../math/Vector';
import { Shape } from '../geometry/Shape';
import { AABB } from '../geometry/AABB';
import { Material } from './Material';
import { EPSILON, EPSILON_SQ } from '../math/MathUtils';
import { EventEmitter, EventCallback } from '../events/EventEmitter';
import { CollisionEventMap } from '../events/CollisionEvents';

let bodyIdCounter = 0;

/**
 * Rigid body that combines a shape with physics properties
 * Bodies add physics behavior to pure geometric shapes
 * Static bodies are represented by mass = Infinity
 */
export class Body {
  readonly id: number;

  // Kinematic state
  position: Vector;
  velocity: Vector;
  acceleration: Vector;

  // Dynamic properties
  mass: number;
  inverseMass: number; // Cached for performance

  // Force accumulation
  private forceAccumulator: Vector;

  // Movement tracking for intentional character movement
  movementVector: Vector;

  // Collision properties
  isSensor: boolean; // Detects collisions but doesn't resolve them
  layer: number; // Collision layer bitmask (which layer this body is on)
  resolutionMask: number; // Resolution mask (which collisions get physically resolved) - BILATERAL
  eventMask: number; // Event emission mask (which layers trigger events) - UNILATERAL

  // Per-body collision events
  private eventEmitter: EventEmitter<CollisionEventMap>;

  /**
   * Computed collision detection mask
   * Automatically derived from eventMask | resolutionMask
   * "Detect collisions where we want events OR resolution"
   */
  get collisionMask(): number {
    return this.eventMask | this.resolutionMask;
  }

  constructor(
    public shape: Shape,
    public material: Material = Material.DEFAULT,
    mass: number = 1.0
  ) {
    if (mass === Infinity) {
      throw new Error('Cannot create body with infinite mass. Use setStatic() instead.');
    }

    this.id = bodyIdCounter++;

    // Position is a direct reference to the shape's center
    // This couples the body position to the shape
    // Both Circle and Rectangle store center as source of truth
    this.position = (shape as any).center;
    this.velocity = Vector.zero();
    this.acceleration = Vector.zero();

    this.forceAccumulator = Vector.zero();
    this.movementVector = Vector.zero();

    this.isSensor = false;
    this.layer = 0xffffffff; // Default layer
    this.resolutionMask = 0xffffffff; // Resolves all collisions by default
    this.eventMask = 0xffffffff; // Emits events for all layers by default
    // collisionMask is computed as: eventMask | resolutionMask

    // Initialize event emitter
    this.eventEmitter = new EventEmitter();

    // Initialize mass
    this.mass = mass;
    this.inverseMass = mass > EPSILON ? 1 / mass : 0;
  }

  // ===== Mass Management =====

  /**
   * Set the body to be static (infinite mass, immovable)
   */
  setStatic(): void {
    this.mass = Infinity;
    this.inverseMass = 0;
    this.velocity.x = 0;
    this.velocity.y = 0;
  }

  /**
   * Check if the body is static (has infinite mass)
   */
  isStatic(): boolean {
    return this.mass === Infinity;
  }

  /**
   * Set the mass of a dynamic body
   */
  setMass(mass: number): void {
    if (this.isStatic()) {
      return; // Static bodies always have infinite mass
    }
    if (mass === Infinity) {
      throw new Error('Cannot set mass to Infinity. Use setStatic() instead.');
    }
    this.mass = mass;
    this.inverseMass = mass > EPSILON ? 1 / mass : 0;
  }

  // ===== Force Application =====

  /**
   * Apply a force to the body (accumulated until clearForces)
   */
  applyForce(force: Vector): void {
    if (this.isStatic()) {
      return;
    }
    this.forceAccumulator.addMut(force);
  }

  /**
   * Apply an immediate velocity change (impulse)
   */
  applyImpulse(impulse: Vector): void {
    if (this.isStatic()) {
      return;
    }
    this.velocity.addMut(impulse.multiply(this.inverseMass));
  }

  /**
   * Apply intentional movement impulse (for character control)
   * Records the movement direction for use in collision resolution
   */
  applyMovement(impulse: Vector): void {
    if (this.isStatic()) {
      return;
    }

    // Store the DIRECTION of movement (normalized), not the impulse magnitude
    // This makes collision detection simpler and more accurate
    if (impulse.lengthSquared() > EPSILON_SQ) {
      this.movementVector = impulse.normalize();
    } else {
      this.movementVector = Vector.zero();
    }

    // Apply the impulse normally
    this.applyImpulse(impulse);
  }

  /**
   * Clear accumulated forces (called after integration)
   */
  clearForces(): void {
    this.forceAccumulator.x = 0;
    this.forceAccumulator.y = 0;
  }

  /**
   * Clear the movement vector after physics step
   */
  clearMovement(): void {
    this.movementVector.x = 0;
    this.movementVector.y = 0;
  }

  // ===== Integration =====

  /**
   * Integrate physics (Semi-implicit Euler with floating-point guards)
   * Called by the physics world during simulation step
   */
  integrate(dt: number, gravity: number): void {
    if (this.isStatic()) {
      return;
    }

    // Calculate acceleration from forces: a = F/m
    const accel = this.forceAccumulator.multiply(this.inverseMass);

    // Update velocity from forces: v = v + a * dt
    this.velocity.addMut(accel.multiply(dt));

    // Apply gravity-based drag: opposes velocity, scaled by friction and mass
    // Heavier bodies decelerate faster by applying damping factor
    // damping = gravity * friction * mass (higher for heavier objects)
    // v' = v * e^(-damping * dt) ≈ v * (1 - damping * dt) for small dt
    if (gravity > 0 && this.material.friction > 0 && !this.isStatic()) {
      const damping = gravity * this.material.friction * this.mass;
      const dampingFactor = Math.max(0, 1 - damping * dt);
      this.velocity.multiplyMut(dampingFactor);
    }

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
    if (this.isStatic()) {
      return 0;
    }
    return 0.5 * this.mass * this.velocity.lengthSquared();
  }

  /**
   * Check if this body can detect collisions with another based on layer/mask filtering
   * Used for broad-phase filtering - allows sensors to be detected
   */
  canDetectCollisionWith(other: Body): boolean {
    // Bilateral collision mask filtering (both bodies must agree)
    // Sensors still respect collision masks for detection
    return !!(this.collisionMask & other.layer && other.collisionMask & this.layer);
  }

  /**
   * Check if this body can resolve collisions with another based on resolution mask filtering
   * Used to determine which detected collisions should have physical resolution
   * BILATERAL check: Both bodies must agree
   */
  canResolveCollisionWith(other: Body): boolean {
    // Sensors never resolve
    if (this.isSensor || other.isSensor) {
      return false;
    }

    // Bilateral resolution mask filtering
    return !!(this.resolutionMask & other.layer && other.resolutionMask & this.layer);
  }

  /**
   * Check if this body can collide with another based on layer/mask filtering
   * Used for collision resolution - excludes sensors
   * Now delegates to canResolveCollisionWith()
   */
  canCollideWith(other: Body): boolean {
    return this.canResolveCollisionWith(other);
  }

  /**
   * Check if this body can emit collision events with another based on event mask filtering
   * UNILATERAL check: Either body matching is sufficient to emit events
   * SENSOR BYPASS: Sensors ALWAYS emit events regardless of mask settings
   */
  canEmitEventWith(other: Body): boolean {
    // Sensors always emit events (bypass event mask filtering)
    if (this.isSensor || other.isSensor) {
      return true;
    }

    // Unilateral event mask check (either body can match)
    // Event emitted if: (this.eventMask & other.layer) OR (other.eventMask & this.layer)
    return !!(this.eventMask & other.layer || other.eventMask & this.layer);
  }

  // ===== Setters =====

  setPosition(position: Vector): void {
    // Update position in-place to maintain reference to shape center
    this.position.x = position.x;
    this.position.y = position.y;
  }

  setVelocity(velocity: Vector): void {
    this.velocity = velocity.clone();
  }

  // ===== Event System =====

  /**
   * Register an event listener for this body's collision events
   */
  on<K extends keyof CollisionEventMap>(
    event: K,
    callback: EventCallback<CollisionEventMap[K]>
  ): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Unregister an event listener
   */
  off<K extends keyof CollisionEventMap>(
    event: K,
    callback: EventCallback<CollisionEventMap[K]>
  ): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Remove all listeners for a specific event, or all events if no event specified
   */
  removeAllListeners(event?: keyof CollisionEventMap): void {
    this.eventEmitter.removeAllListeners(event);
  }

  /**
   * Internal method for World to emit events to this body
   * @internal
   */
  emit<K extends keyof CollisionEventMap>(
    event: K,
    data: CollisionEventMap[K]
  ): void {
    this.eventEmitter.emit(event, data);
  }
}

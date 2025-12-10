import { Vector } from '../math/Vector';
import { Body } from '../physics/Body';
import { AABB } from '../geometry/AABB';
import { Shape } from '../geometry/Shape';
import { SpatialHash } from '../spatial/SpatialHash';
import { CollisionDetector } from '../collision/CollisionDetector';
import { CollisionResolver } from '../collision/CollisionResolver';
import { ContinuousCollisionDetection } from '../collision/ContinuousCollisionDetection';
import { Manifold } from '../collision/Manifold';
import { WorldConfig, DEFAULT_WORLD_CONFIG } from './WorldConfig';
import { EPSILON } from '../math/MathUtils';
import { EventEmitter, EventCallback } from '../events/EventEmitter';
import { CollisionEvent, CollisionEventMap } from '../events/CollisionEvents';
import { COLLISION_START, COLLISION_ACTIVE, COLLISION_END } from '../events/CollisionEventTypes';
import { testShapeOverlap } from '../collision/ShapeOverlap';

/**
 * Main physics world that orchestrates the simulation
 */
export class World {
  private config: Required<WorldConfig>;
  private bodies: Map<number, Body>;
  private broadPhase: SpatialHash;
  private detector: CollisionDetector;
  private resolver: CollisionResolver;

  // Simulation state
  private time: number;
  private accumulator: number;

  // Collision tracking for events
  private currentCollisions: Set<number>;
  private previousCollisions: Set<number>;
  private eventEmitter: EventEmitter<CollisionEventMap>;

  // CCD tracking - stores how much time each body has consumed due to TOI movement
  private consumedTime: Map<number, number>;

  constructor(config: WorldConfig = {}) {
    // Merge with defaults
    this.config = { ...DEFAULT_WORLD_CONFIG, ...config };

    this.bodies = new Map();
    this.broadPhase = new SpatialHash(this.config.spatialCellSize);
    this.detector = new CollisionDetector();
    this.resolver = new CollisionResolver();

    // Configure resolver
    this.resolver.positionIterations = this.config.positionIterations;
    this.resolver.velocityIterations = this.config.velocityIterations;

    this.time = 0;
    this.accumulator = 0;

    this.currentCollisions = new Set();
    this.previousCollisions = new Set();
    this.eventEmitter = new EventEmitter();
    this.consumedTime = new Map();
  }

  // ===== Body Management =====

  addBody(body: Body): void {
    this.bodies.set(body.id, body);
    this.broadPhase.insert(body);
  }

  removeBody(body: Body): void {
    this.bodies.delete(body.id);
    this.broadPhase.remove(body);
  }

  getBody(id: number): Body | undefined {
    return this.bodies.get(id);
  }

  getBodies(): Body[] {
    return Array.from(this.bodies.values());
  }

  clearBodies(): void {
    this.bodies.clear();
    this.broadPhase.clear();
  }

  // ===== Event System =====

  /**
   * Register an event listener
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

  // ===== Simulation =====

  /**
   * Step the physics simulation
   * @param deltaTime Time since last step in seconds
   */
  step(deltaTime: number): void {
    // Clamp deltaTime to prevent spiral of death
    const clampedDelta = Math.min(deltaTime, this.config.maxSubSteps * this.config.timeStep);

    this.accumulator += clampedDelta;

    let steps = 0;
    while (this.accumulator >= this.config.timeStep && steps < this.config.maxSubSteps) {
      this.fixedStep(this.config.timeStep);
      this.accumulator -= this.config.timeStep;
      this.time += this.config.timeStep;
      steps++;
    }
  }

  /**
   * Perform a single fixed timestep simulation with proper TOI integration.
   *
   * CORRECTED SIMULATION LOOP:
   * 1. CCD: Move fast bodies to TOI (partial integration)
   * 2. Collision detection: Detect all collisions
   * 3. Collision resolution: Fix velocities (impulse-based)
   * 4. Integration: Move bodies for remaining time
   * 5. Update broad-phase and clear forces
   *
   * WHY THIS WORKS:
   * - Bodies moved to TOI have ZERO penetration
   * - Remaining time integration completes the frame
   * - Total time = TOI * dt + remaining * dt = dt (conserved)
   * - No need for aggressive position correction
   */
  private fixedStep(dt: number): void {
    // Clear consumed time tracking
    this.consumedTime.clear();

    // 1. CCD: Process fast-moving bodies, move to TOI
    // Only process first collision per body to keep it simple
    const pairs = this.broadPhase.getPairs();

    for (const pair of pairs) {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;

      // Skip if either body already handled by CCD this frame
      if (this.consumedTime.has(bodyA.id) || this.consumedTime.has(bodyB.id)) {
        continue;
      }

      // Check if either body is moving fast enough to need CCD
      const needsCCD =
        ContinuousCollisionDetection.needsSweptTest(bodyA, dt) ||
        ContinuousCollisionDetection.needsSweptTest(bodyB, dt);

      if (!needsCCD) {
        continue;
      }

      // Run swept collision test
      const sweptResult = ContinuousCollisionDetection.checkSweptCollision(bodyA, bodyB, dt);

      if (!sweptResult) {
        continue;
      }

      // Collision will happen at TOI!
      // Move both bodies to exact time-of-impact (partial integration)
      const toiDt = sweptResult.toi * dt;
      bodyA.integrate(toiDt, this.config.gravity);
      bodyB.integrate(toiDt, this.config.gravity);

      // Track consumed time for this body
      this.consumedTime.set(bodyA.id, toiDt);
      this.consumedTime.set(bodyB.id, toiDt);
    }

    // 2. COLLISION DETECTION: Detect all collisions at current positions
    // Bodies that moved to TOI are now exactly touching (zero penetration)
    // Other bodies are at their original positions
    // Separate sensor and regular manifolds
    const regularManifolds: Manifold[] = [];
    const sensorManifolds: Manifold[] = [];

    // Swap sets for lifecycle tracking
    const temp = this.previousCollisions;
    this.previousCollisions = this.currentCollisions;
    this.currentCollisions = temp;
    this.currentCollisions.clear();

    for (const pair of pairs) {
      const manifold = this.detector.detect(pair.bodyA, pair.bodyB);
      if (manifold && manifold.contacts.length > 0) {
        const collisionKey = this.getCollisionKey(pair.bodyA, pair.bodyB);
        this.currentCollisions.add(collisionKey);

        const isSensor = pair.bodyA.isSensor || pair.bodyB.isSensor;
        if (isSensor) {
          sensorManifolds.push(manifold);
        } else {
          regularManifolds.push(manifold);
        }
      }
    }

    // Emit events BEFORE resolution
    this.emitCollisionEvents(regularManifolds, sensorManifolds);

    // 3. COLLISION RESOLUTION: Fix velocities and minimal position correction
    // Position correction is minimal since CCD prevents deep penetration
    // Filter manifolds to only resolve those that should be resolved (based on resolutionMask)
    const resolvableManifolds = regularManifolds.filter(manifold =>
      manifold.bodyA.canResolveCollisionWith(manifold.bodyB)
    );

    if (resolvableManifolds.length > 0) {
      this.resolver.resolve(resolvableManifolds, dt);
    }

    // 4. INTEGRATION: Move bodies for remaining time
    // Bodies that moved to TOI: integrate for (dt - consumed)
    // Other bodies: integrate for full dt
    for (const body of this.bodies.values()) {
      const consumed = this.consumedTime.get(body.id) || 0;
      const remaining = dt - consumed;

      // Only integrate if there's remaining time
      if (remaining > EPSILON) {
        body.integrate(remaining, this.config.gravity);
      }
    }

    // 5. UPDATE BROAD-PHASE: Update spatial hash with new positions
    for (const body of this.bodies.values()) {
      this.broadPhase.update(body);
    }

    // 6. CLEAR FORCES AND MOVEMENT: Reset force accumulators and movement vectors for next frame
    for (const body of this.bodies.values()) {
      body.clearForces();
      body.clearMovement();
    }
  }

  // ===== Queries =====

  /**
   * Query for bodies at a specific point
   */
  queryPoint(point: Vector): Body[] {
    const bodies = this.getBodies();
    return bodies.filter((body) => body.shape.contains(point));
  }

  /**
   * Query for bodies in a region
   */
  queryRegion(aabb: AABB): Body[] {
    return this.broadPhase.queryRegion(aabb);
  }

  /**
   * Query all bodies that overlap with the given shape
   * @param shape - The shape to check for overlaps
   * @returns Array of unique bodies that overlap with the shape
   */
  queryOverlapsWithShape(shape: Shape): Body[] {
    // Use broad-phase to get nearby candidates
    const aabb = shape.getAABB();
    const candidates = this.broadPhase.queryRegion(aabb);

    const overlaps: Body[] = [];
    const seen = new Set<number>(); // Track body IDs to ensure uniqueness

    for (const candidate of candidates) {
      // Skip if already added (ensure uniqueness)
      if (seen.has(candidate.id)) {
        continue;
      }

      // Use pure shape overlap test (no Bodies needed!)
      if (testShapeOverlap(shape, candidate.shape)) {
        overlaps.push(candidate);
        seen.add(candidate.id);
      }
    }

    return overlaps;
  }

  /**
   * Query all bodies that overlap with the given body (excluding the body itself)
   * @param body - The body to check for overlaps
   * @returns Array of unique bodies that overlap with the given body
   */
  queryOverlapsWithBody(body: Body): Body[] {
    // Use broad-phase to get nearby candidates
    const aabb = body.getAABB();
    const candidates = this.broadPhase.queryRegion(aabb);

    const overlaps: Body[] = [];
    const seen = new Set<number>(); // Track body IDs to ensure uniqueness

    for (const candidate of candidates) {
      // Skip self
      if (candidate.id === body.id) {
        continue;
      }

      // Skip if already added (ensure uniqueness)
      if (seen.has(candidate.id)) {
        continue;
      }

      // Use pure shape overlap test
      if (testShapeOverlap(body.shape, candidate.shape)) {
        overlaps.push(candidate);
        seen.add(candidate.id);
      }
    }

    return overlaps;
  }

  // ===== Utility =====

  getTime(): number {
    return this.time;
  }

  getGravity(): number {
    return this.config.gravity;
  }

  setGravity(gravity: number): void {
    this.config.gravity = gravity;
  }

  /**
   * Generate a unique key for a collision pair
   */
  private getCollisionKey(bodyA: Body, bodyB: Body): number {
    // Use Cantor pairing function for unique collision key
    const [a, b] = bodyA.id < bodyB.id ? [bodyA.id, bodyB.id] : [bodyB.id, bodyA.id];
    return ((a + b) * (a + b + 1)) / 2 + b;
  }

  /**
   * Decompose a collision key back into body IDs
   * Inverse of Cantor pairing function
   */
  private decomposeCollisionKey(key: number): [number, number] {
    const w = Math.floor((Math.sqrt(8 * key + 1) - 1) / 2);
    const t = (w * w + w) / 2;
    const b = key - t;
    const a = w - b;
    return [a, b];
  }

  /**
   * Emit collision events for the current frame
   * Emits to both world (if listeners exist) and individual bodies
   */
  private emitCollisionEvents(regularManifolds: Manifold[], sensorManifolds: Manifold[]): void {
    // Check if world has listeners (zero overhead if not)
    const hasWorldListeners =
      this.eventEmitter.hasListeners(COLLISION_START) ||
      this.eventEmitter.hasListeners(COLLISION_ACTIVE) ||
      this.eventEmitter.hasListeners(COLLISION_END);

    // Build map of current collisions to their manifolds for fast lookup
    const currentManifoldMap = new Map<number, Manifold>();
    const allManifolds = [...regularManifolds, ...sensorManifolds];

    for (const manifold of allManifolds) {
      const key = this.getCollisionKey(manifold.bodyA, manifold.bodyB);
      currentManifoldMap.set(key, manifold);
    }

    // Use set operations for efficient lifecycle detection
    // NEW collisions: in current but not in previous
    for (const [key, manifold] of currentManifoldMap) {
      // Skip static-static collisions (not interesting)
      if (manifold.bodyA.isStatic() && manifold.bodyB.isStatic()) {
        continue;
      }

      // EVENT MASK FILTERING (unilateral with sensor bypass)
      // Skip if neither body wants to emit events with the other
      if (!manifold.bodyA.canEmitEventWith(manifold.bodyB)) {
        continue;
      }

      const isNew = !this.previousCollisions.has(key);

      const event: CollisionEvent = {
        bodyA: manifold.bodyA,
        bodyB: manifold.bodyB,
        isSensor: manifold.bodyA.isSensor || manifold.bodyB.isSensor,
        manifold: manifold,
      };

      const eventType = isNew ? COLLISION_START : COLLISION_ACTIVE;

      // Emit to world (global listeners) - only if listeners exist
      if (hasWorldListeners) {
        this.eventEmitter.emit(eventType, event);
      }

      // Emit to individual bodies (targeted listeners)
      manifold.bodyA.emit(eventType, event);
      manifold.bodyB.emit(eventType, event);
    }

    // ENDED collisions: in previous but not in current
    for (const prevKey of this.previousCollisions) {
      if (!this.currentCollisions.has(prevKey)) {
        // Need to reconstruct bodies for ended events
        const [idA, idB] = this.decomposeCollisionKey(prevKey);
        const bodyA = this.getBody(idA);
        const bodyB = this.getBody(idB);

        if (bodyA && bodyB) {
          // Skip static-static collisions (not interesting)
          if (bodyA.isStatic() && bodyB.isStatic()) {
            continue;
          }

          // EVENT MASK FILTERING (unilateral with sensor bypass)
          // Skip if neither body wants to emit events with the other
          if (!bodyA.canEmitEventWith(bodyB)) {
            continue;
          }

          const event: CollisionEvent = {
            bodyA,
            bodyB,
            isSensor: bodyA.isSensor || bodyB.isSensor,
            manifold: undefined, // No manifold data for ended collisions
          };

          // Emit to world (global listeners) - only if listeners exist
          if (hasWorldListeners) {
            this.eventEmitter.emit(COLLISION_END, event);
          }

          // Emit to individual bodies (targeted listeners)
          bodyA.emit(COLLISION_END, event);
          bodyB.emit(COLLISION_END, event);
        }
      }
    }
  }
}

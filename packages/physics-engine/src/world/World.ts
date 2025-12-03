import { Vector } from '../math/Vector';
import { Body } from '../physics/Body';
import { AABB } from '../geometry/AABB';
import { SpatialHash } from '../spatial/SpatialHash';
import { CollisionDetector } from '../collision/CollisionDetector';
import { CollisionResolver } from '../collision/CollisionResolver';
import { ContinuousCollisionDetection } from '../collision/ContinuousCollisionDetection';
import { Manifold } from '../collision/Manifold';
import { WorldConfig, DEFAULT_WORLD_CONFIG } from './WorldConfig';
import { EPSILON } from '../math/MathUtils';

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
    const manifolds: Manifold[] = [];
    this.currentCollisions.clear();

    for (const pair of pairs) {
      const manifold = this.detector.detect(pair.bodyA, pair.bodyB);
      if (manifold && manifold.contacts.length > 0) {
        manifolds.push(manifold);

        // Track collision for events
        const collisionKey = this.getCollisionKey(pair.bodyA, pair.bodyB);
        this.currentCollisions.add(collisionKey);
      }
    }

    // 3. COLLISION RESOLUTION: Fix velocities and minimal position correction
    // Position correction is minimal since CCD prevents deep penetration
    if (manifolds.length > 0) {
      this.resolver.resolve(manifolds, dt);
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

    // 6. CLEAR FORCES: Reset force accumulators for next frame
    for (const body of this.bodies.values()) {
      body.clearForces();
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
}

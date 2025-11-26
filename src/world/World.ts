import { Vector } from '../math/Vector';
import { Body } from '../physics/Body';
import { AABB } from '../geometry/AABB';
import { SpatialHash } from '../spatial/SpatialHash';
import { CollisionDetector } from '../collision/CollisionDetector';
import { CollisionResolver } from '../collision/CollisionResolver';
import { Manifold } from '../collision/Manifold';
import { WorldConfig, DEFAULT_WORLD_CONFIG } from './WorldConfig';

/**
 * Main physics world that orchestrates the simulation
 */
export class World {
  private config: Required<WorldConfig>;
  private bodies: Map<string, Body>;
  private broadPhase: SpatialHash;
  private detector: CollisionDetector;
  private resolver: CollisionResolver;

  // Simulation state
  private time: number;
  private accumulator: number;

  // Collision tracking for events
  private currentCollisions: Set<string>;

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

  getBody(id: string): Body | undefined {
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
   * Perform a single fixed timestep simulation
   */
  private fixedStep(dt: number): void {
    // 1. Integrate all dynamic bodies
    for (const body of this.bodies.values()) {
      body.integrate(dt, this.config.gravity);
    }

    // 2. Update broad-phase with new positions
    for (const body of this.bodies.values()) {
      this.broadPhase.update(body);
    }

    // 3. Get collision pairs from broad-phase
    const pairs = this.broadPhase.getPairs();

    // 4. Narrow-phase: detect collisions
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

    // 5. Resolve collisions
    if (manifolds.length > 0) {
      this.resolver.resolve(manifolds, dt);
    }

    // 6. Clear forces
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

  getGravity(): Vector {
    return this.config.gravity.clone();
  }

  setGravity(gravity: Vector): void {
    this.config.gravity = gravity.clone();
  }

  /**
   * Generate a unique key for a collision pair
   */
  private getCollisionKey(bodyA: Body, bodyB: Body): string {
    return bodyA.id < bodyB.id ? `${bodyA.id}_${bodyB.id}` : `${bodyB.id}_${bodyA.id}`;
  }
}

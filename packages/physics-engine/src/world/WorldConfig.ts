/**
 * Configuration for the physics world
 */
export interface WorldConfig {
  /** Gravity coefficient for damping (0 = no damping, 1 = default damping, 2 = double damping, etc.), default 1 */
  gravity?: number;

  /** Fixed timestep in seconds, default 1/60 */
  timeStep?: number;

  /** Maximum substeps per frame to prevent spiral of death, default 8 */
  maxSubSteps?: number;

  /** Grid cell size for spatial hash in pixels, default 100 */
  spatialCellSize?: number;

  /**
   * Position correction iterations - how many times to push apart overlapping objects.
   *
   * WHY MULTIPLE ITERATIONS?
   * When you have stacked objects (box on box on ground), pushing apart the bottom box
   * affects the box above it. Multiple iterations let the whole stack gradually separate.
   *
   * Default: 4 (resolves ~87% of penetration, good balance)
   * - 1 = objects sink into each other
   * - 3 = resolves ~79%
   * - 4 = resolves ~87%, stable for most games
   * - 6+ = can cause instability
   */
  positionIterations?: number;

  /**
   * Velocity/impulse resolution iterations - how many times to recalculate collision velocities.
   *
   * WHY MULTIPLE ITERATIONS?
   * When you have multiple simultaneous collisions (ball between two walls, chain of boxes),
   * resolving one collision changes velocities, which affects other collisions. We iterate
   * until all collisions "converge" to a stable solution.
   *
   * Default: 8 (industry standard from Box2D)
   * - 1 = fast but buggy with multiple collisions
   * - 8 = stable, handles complex scenarios
   * - 20+ = overkill, wastes CPU
   */
  velocityIterations?: number;
}

/**
 * Default world configuration
 */
export const DEFAULT_WORLD_CONFIG: Required<WorldConfig> = {
  gravity: 1,
  timeStep: 1 / 60,
  maxSubSteps: 8,
  spatialCellSize: 100,
  positionIterations: 1,
  velocityIterations: 6,
};

import { Vector } from '../math/Vector';

/**
 * Configuration for the physics world
 */
export interface WorldConfig {
  /** Gravity acceleration (pixels/s²), default (0, 980) */
  gravity?: Vector;

  /** Fixed timestep in seconds, default 1/60 */
  timeStep?: number;

  /** Maximum substeps per frame to prevent spiral of death, default 8 */
  maxSubSteps?: number;

  /** Grid cell size for spatial hash in pixels, default 100 */
  spatialCellSize?: number;

  /** Position correction iterations, default 8 */
  positionIterations?: number;

  /** Velocity/impulse resolution iterations, default 10 */
  velocityIterations?: number;
}

/**
 * Default world configuration
 */
export const DEFAULT_WORLD_CONFIG: Required<WorldConfig> = {
  gravity: new Vector(0, 980),
  timeStep: 1 / 60,
  maxSubSteps: 8,
  spatialCellSize: 100,
  positionIterations: 8,
  velocityIterations: 10,
};

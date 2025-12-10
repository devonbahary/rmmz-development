// Core
export { World } from './world/World';
export { WorldConfig, DEFAULT_WORLD_CONFIG } from './world/WorldConfig';
export { Body } from './physics/Body';
export { Material } from './physics/Material';

// Shapes (usable independently for spatial queries)
export { Shape, ShapeType } from './geometry/Shape';
export { Circle } from './geometry/Circle';
export { Rectangle } from './geometry/Rectangle';
export { AABB } from './geometry/AABB';

// Math
export { Vector } from './math/Vector';
export { EPSILON, EPSILON_SQ, approxEqual, clamp, approxZero } from './math/MathUtils';

// Collision (for advanced users)
export { Contact } from './collision/Contact';
export { Manifold } from './collision/Manifold';
export {
  testShapeOverlap,
  testCircleCircleOverlap,
  testCircleRectangleOverlap,
  testRectangleRectangleOverlap
} from './collision/ShapeOverlap';

// Events
export { EventEmitter, EventCallback } from './events/EventEmitter';
export { CollisionEvent, CollisionEventMap } from './events/CollisionEvents';
export {
  COLLISION_EVENT_TYPES,
  COLLISION_START,
  COLLISION_ACTIVE,
  COLLISION_END,
  type CollisionEventType
} from './events/CollisionEventTypes';

// Spatial (for advanced users)
export { BroadPhase } from './spatial/BroadPhase';
export { SpatialHash } from './spatial/SpatialHash';
export { Pair } from './spatial/Pair';

//-----------------------------------------------------------------------------
// Game_CharacterBase
//
// The superclass of Game_Character. It handles basic information, such as
// coordinates and images, shared by all characters.

import { Body, Circle, Material, Rectangle, Vector } from 'physics-engine';
import {
  DEFAULT_CHARACTER_HEIGHT,
  DEFAULT_CHARACTER_RADIUS,
  DEFAULT_CHARACTER_WIDTH,
  MOVEMENT_VELOCITY_THRESHOLD_SQ,
} from '../constants';
import {
  getDisplayDirection,
  getVelocityForDirection,
  composeDirection,
} from '../utilities/character';
import { toWorldCoords, fromWorldCoords, toWorldSize } from '../utilities/map';

// Property overrides to read from physics body when present
Object.defineProperties(Game_CharacterBase.prototype, {
  x: {
    get: function () {
      if (this.body) {
        const tiles = fromWorldCoords(this.body.position.x, this.body.position.y);
        return tiles.x;
      }
      return this._x;
    },
    configurable: true,
  },
  y: {
    get: function () {
      if (this.body) {
        const tiles = fromWorldCoords(this.body.position.x, this.body.position.y);
        return tiles.y;
      }
      return this._y;
    },
    configurable: true,
  },
  realX: {
    get: function () {
      if (this.body) {
        const tiles = fromWorldCoords(this.body.position.x, this.body.position.y);
        return tiles.x;
      }
      return this._realX;
    },
    configurable: true,
  },
  realY: {
    get: function () {
      if (this.body) {
        const tiles = fromWorldCoords(this.body.position.x, this.body.position.y);
        return tiles.y;
      }
      return this._realY;
    },
    configurable: true,
  },
});

// Initialize body property
const _Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function () {
  _Game_CharacterBase_initMembers.call(this);
  this.body = null;
};

// Create physics body for this character
Game_CharacterBase.prototype.createPhysicsBody = function (world, options = {}) {
  if (this.body) {
    return;
  }

  const shape = options.shape || 'circle';
  const material = options.material || Material.DEFAULT;

  // Get current position in world coordinates
  const worldPos = toWorldCoords(this._x, this._y);

  // Create shape
  let physicsShape;
  if (shape === 'circle') {
    const radius = toWorldSize(options.radius || DEFAULT_CHARACTER_RADIUS);
    physicsShape = new Circle(worldPos, radius);
  } else {
    const width = toWorldSize(options.width || DEFAULT_CHARACTER_WIDTH);
    const height = toWorldSize(options.height || DEFAULT_CHARACTER_HEIGHT);
    physicsShape = Rectangle.fromCenter(worldPos, width, height);
  }

  // Create body with mass
  const mass = options.mass !== undefined ? options.mass : 1.0;
  this.body = new Body(physicsShape, material, mass);

  // Add to world
  world.addBody(this.body);
};

// Remove physics body from this character
Game_CharacterBase.prototype.removePhysicsBody = function (world) {
  if (!this.body) {
    return;
  }

  // Save current position to internal state for smooth transition
  this._x = this.x;
  this._y = this.y;
  this._realX = this.realX;
  this._realY = this.realY;

  // Remove from world
  world.removeBody(this.body);

  // Clear reference
  this.body = null;
};

// Override moveStraight to handle all 8 directions (unified interface)
// Now accepts dir8 (1-9), not just cardinal (2,4,6,8)
const _Game_CharacterBase_moveStraight = Game_CharacterBase.prototype.moveStraight;
Game_CharacterBase.prototype.moveStraight = function (d) {
  // Fall back to vanilla if no physics body
  if (!this.body) {
    return _Game_CharacterBase_moveStraight.call(this, d);
  }

  // Physics-based movement always succeeds (collision handled by engine)
  this.setMovementSuccess(true);

  // Update sprite direction using intelligent selection algorithm
  const newDirection = getDisplayDirection(d, this.direction());
  this.setDirection(newDirection);

  // Calculate normalized velocity for any dir8 input
  const speed = this.distancePerFrame();
  const velocity = getVelocityForDirection(d, speed);

  // Apply movement impulse (tracks intentional movement for collision resolution)
  const impulse = velocity.multiply(this.body.mass);
  this.body.applyMovement(impulse);

  // Maintain compatibility with step counting
  this.increaseSteps();
};

// Override moveDiagonally - now just a wrapper around unified moveStraight
// Kept for compatibility with RMMZ event commands (ROUTE_MOVE_LOWER_L, etc.)
Game_CharacterBase.prototype.moveDiagonally = function (horz, vert) {
  // Convert horz + vert to dir8 and delegate to moveStraight
  const dir8 = composeDirection(horz, vert);
  this.moveStraight(dir8);
};

// Override jump to use physics impulse
const _Game_CharacterBase_jump = Game_CharacterBase.prototype.jump;
Game_CharacterBase.prototype.jump = function (xPlus, yPlus) {
  if (!this.body) {
    return _Game_CharacterBase_jump.call(this, xPlus, yPlus);
  }

  // Set direction
  if (Math.abs(xPlus) > Math.abs(yPlus)) {
    if (xPlus !== 0) {
      this.setDirection(xPlus < 0 ? 4 : 6);
    }
  } else {
    if (yPlus !== 0) {
      this.setDirection(yPlus < 0 ? 8 : 2);
    }
  }

  // Calculate impulse for jump
  const pixelJumpX = toWorldSize(xPlus);
  const pixelJumpY = toWorldSize(yPlus);
  const distance = Math.round(Math.sqrt(xPlus * xPlus + yPlus * yPlus));
  const jumpPeak = 10 + distance - this._moveSpeed;
  const framesForJump = jumpPeak * 2;

  const impulse = new Vector(pixelJumpX / framesForJump, pixelJumpY / framesForJump);

  this.body.applyImpulse(impulse.multiply(this.body.mass));

  // Set jump state for animation
  this._jumpPeak = jumpPeak;
  this._jumpCount = framesForJump;

  this.resetStopCount();
  this.straighten();
};

// Override setPosition to set body position
const _Game_CharacterBase_setPosition = Game_CharacterBase.prototype.setPosition;
Game_CharacterBase.prototype.setPosition = function (x, y) {
  if (!this.body) {
    return _Game_CharacterBase_setPosition.call(this, x, y);
  }

  // Convert tile coords to pixel coords and set body position
  const pixelPos = toWorldCoords(x, y);
  this.body.setPosition(pixelPos);

  // Zero out velocity when teleporting
  this.body.setVelocity(Vector.zero());
};

// Override update loop to skip updateMove when body exists
const _Game_CharacterBase_update = Game_CharacterBase.prototype.update;
Game_CharacterBase.prototype.update = function () {
  if (!this.body) {
    return _Game_CharacterBase_update.call(this);
  }

  // Physics-based update
  if (this.isStopping()) {
    this.updateStop();
  }

  // Handle jumping (animation only - physics handles position)
  if (this.isJumping()) {
    this.updateJump();
  }

  // Skip updateMove() - physics engine updates position

  this.updateAnimation();
};

// Override isMoving to check body velocity
const _Game_CharacterBase_isMoving = Game_CharacterBase.prototype.isMoving;
Game_CharacterBase.prototype.isMoving = function () {
  if (!this.body) {
    return _Game_CharacterBase_isMoving.call(this);
  }

  // Check if body has significant velocity
  return this.body.velocity.lengthSquared() > MOVEMENT_VELOCITY_THRESHOLD_SQ;
};

// Override scrolledX and scrolledY to read directly from physics body
// Vanilla implementation reads _realX/_realY directly which may not be in sync
// Instead, we calculate scroll position directly from the physics body
const _Game_CharacterBase_scrolledX = Game_CharacterBase.prototype.scrolledX;
Game_CharacterBase.prototype.scrolledX = function () {
  if (this.body) {
    const tiles = fromWorldCoords(this.body.position.x, this.body.position.y);
    return $gameMap.adjustX(tiles.x);
  }
  return _Game_CharacterBase_scrolledX.call(this);
};

const _Game_CharacterBase_scrolledY = Game_CharacterBase.prototype.scrolledY;
Game_CharacterBase.prototype.scrolledY = function () {
  if (this.body) {
    const tiles = fromWorldCoords(this.body.position.x, this.body.position.y);
    return $gameMap.adjustY(tiles.y);
  }
  return _Game_CharacterBase_scrolledY.call(this);
};

// Override canPass to always return true when body exists
const _Game_CharacterBase_canPass = Game_CharacterBase.prototype.canPass;
Game_CharacterBase.prototype.canPass = function (x, y, d) {
  if (this.body) {
    // Physics handles collision
    return true;
  }
  return _Game_CharacterBase_canPass.call(this, x, y, d);
};

// Override canPassDiagonally to always return true when body exists
const _Game_CharacterBase_canPassDiagonally = Game_CharacterBase.prototype.canPassDiagonally;
Game_CharacterBase.prototype.canPassDiagonally = function (x, y, horz, vert) {
  if (this.body) {
    // Physics handles collision
    return true;
  }
  return _Game_CharacterBase_canPassDiagonally.call(this, x, y, horz, vert);
};

// update body sensor flag
const _Game_CharacterBase_setThrough = Game_CharacterBase.prototype.setThrough;
Game_CharacterBase.prototype.setThrough = function (through) {
  _Game_CharacterBase_setThrough.call(this, through);
  if (this.body) {
    this.body.isSensor = through;
  }
};

//-----------------------------------------------------------------------------
// Game_CharacterBase
//
// The superclass of Game_Character. It handles basic information, such as
// coordinates and images, shared by all characters.

import { Body, BodyType, Circle, Material, Rectangle, Vector } from 'physics-engine';

// Property overrides to read from physics body when present
Object.defineProperties(Game_CharacterBase.prototype, {
  x: {
    get: function () {
      if (this.body) {
        const tiles = window._physick_fromWorldCoords(this.body.position.x, this.body.position.y);
        return tiles.x;
      }
      return this._x;
    },
    configurable: true,
  },
  y: {
    get: function () {
      if (this.body) {
        const tiles = window._physick_fromWorldCoords(this.body.position.x, this.body.position.y);
        return tiles.y;
      }
      return this._y;
    },
    configurable: true,
  },
  realX: {
    get: function () {
      if (this.body) {
        const tiles = window._physick_fromWorldCoords(this.body.position.x, this.body.position.y);
        return tiles.x;
      }
      return this._realX;
    },
    configurable: true,
  },
  realY: {
    get: function () {
      if (this.body) {
        const tiles = window._physick_fromWorldCoords(this.body.position.x, this.body.position.y);
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
    console.warn('Character already has physics body');
    return;
  }

  const shape = options.shape || 'circle';
  const bodyType = options.bodyType || BodyType.Dynamic;
  const material = options.material || Material.DEFAULT;

  // Get current position in world coordinates
  const worldPos = window._physick_toWorldCoords(this._x, this._y);

  // Create shape
  let physicsShape;
  if (shape === 'circle') {
    const radius = window._physick_toWorldSize(options.radius || 0.4);
    physicsShape = new Circle(worldPos, radius);
  } else {
    const width = window._physick_toWorldSize(options.width || 0.8);
    const height = window._physick_toWorldSize(options.height || 0.8);
    physicsShape = Rectangle.fromCenter(worldPos, width, height);
  }

  // Create body
  this.body = new Body(physicsShape, bodyType, material);

  // Set mass for dynamic bodies
  if (bodyType === BodyType.Dynamic && options.mass !== undefined) {
    this.body.setMass(options.mass);
  }

  // Add to world
  world.addBody(this.body);

  console.log(`Created physics body for character at (${this._x}, ${this._y})`);
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

  console.log('Removed physics body from character');
};

// Helper: Convert RMMZ direction to velocity vector
Game_CharacterBase.prototype._getVelocityForDirection = function (d, speedInTiles) {
  const pixelSpeed = window._physick_toWorldSize(speedInTiles);

  switch (d) {
    case 2:
      return new Vector(0, pixelSpeed); // Down
    case 4:
      return new Vector(-pixelSpeed, 0); // Left
    case 6:
      return new Vector(pixelSpeed, 0); // Right
    case 8:
      return new Vector(0, -pixelSpeed); // Up
    default:
      return Vector.zero();
  }
};

// Override moveStraight to use physics velocity
const _Game_CharacterBase_moveStraight = Game_CharacterBase.prototype.moveStraight;
Game_CharacterBase.prototype.moveStraight = function (d) {
  console.log('moveStraight');
  if (!this.body) {
    return _Game_CharacterBase_moveStraight.call(this, d);
  }

  // Physics handles collision - always succeed
  this.setMovementSuccess(true);
  this.setDirection(d);

  // Calculate and apply velocity
  const speed = this.distancePerFrame();
  const velocity = this._getVelocityForDirection(d, speed);
  this.body.setVelocity(velocity);
  console.log(this.body.velocity);

  this.increaseSteps();
};

// Override moveDiagonally to use physics velocity
const _Game_CharacterBase_moveDiagonally = Game_CharacterBase.prototype.moveDiagonally;
Game_CharacterBase.prototype.moveDiagonally = function (horz, vert) {
  if (!this.body) {
    return _Game_CharacterBase_moveDiagonally.call(this, horz, vert);
  }

  this.setMovementSuccess(true);

  // Calculate diagonal velocity (normalized)
  const speed = this.distancePerFrame();
  const horzVel = this._getVelocityForDirection(horz, speed);
  const vertVel = this._getVelocityForDirection(vert, speed);

  // Combine and normalize to maintain consistent speed
  const velocity = horzVel.add(vertVel);
  const pixelSpeed = window._physick_toWorldSize(speed);
  const normalizedVelocity = velocity.normalize().multiply(pixelSpeed);

  this.body.setVelocity(normalizedVelocity);

  this.increaseSteps();

  // Handle direction updates
  if (this._direction === this.reverseDir(horz)) {
    this.setDirection(horz);
  }
  if (this._direction === this.reverseDir(vert)) {
    this.setDirection(vert);
  }
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
  const pixelJumpX = window._physick_toWorldSize(xPlus);
  const pixelJumpY = window._physick_toWorldSize(yPlus);
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
  const pixelPos = window._physick_toWorldCoords(x, y);
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
  return this.body.velocity.lengthSquared() > 0.01;
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

// Override setThrough to update body sensor flag
const _Game_CharacterBase_setThrough = Game_CharacterBase.prototype.setThrough;
Game_CharacterBase.prototype.setThrough = function (through) {
  _Game_CharacterBase_setThrough.call(this, through);
  if (this.body) {
    this.body.isSensor = through;
  }
};

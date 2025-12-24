//-----------------------------------------------------------------------------
// Game_Player
//
// The game object class for the player. It contains event starting
// determinants and map scrolling functions.

import { Rectangle } from 'physics-engine';
import { createActionDetectionRect } from '../utilities/character';

const _Game_Player_initMembers = Game_Player.prototype.initMembers;
Game_Player.prototype.initMembers = function () {
  _Game_Player_initMembers.call(this);
  this._physickPrevScrollX = null;
  this._physickPrevScrollY = null;
};

Game_Player.prototype.saveScrollPositionForCamera = function () {
  if (!this.body) return;
  this._physickPrevScrollX = this.scrolledX();
  this._physickPrevScrollY = this.scrolledY();
};

Game_Player.prototype.getInputDirection = function () {
  return Input.dir8; // override from dir4
};

// Override moveByInput to remove the isMoving() check
const _Game_Player_moveByInput = Game_Player.prototype.moveByInput;
Game_Player.prototype.moveByInput = function () {
  if (!$gamePlayer.body) {
    return _Game_Player_moveByInput.call(this);
  }

  // override isMoving check; allow input even when moving (physics-based)
  if (this.canMove()) {
    let direction = this.getInputDirection();
    if (direction > 0) {
      $gameTemp.clearDestination();
    } else if ($gameTemp.isDestinationValid()) {
      const x = $gameTemp.destinationX();
      const y = $gameTemp.destinationY();
      direction = this.findDirectionTo(x, y);
    }
    if (direction > 0) {
      this.executeMove(direction);
    }
  }
};

// overwrite
Game_Player.prototype.update = function (sceneActive) {
  const lastScrolledX = this.scrolledX();
  const lastScrolledY = this.scrolledY();
  const wasMoving = this.isMoving();
  this.updateDashing();
  if (sceneActive) {
    this.moveByInput();
  }
  Game_Character.prototype.update.call(this);
  this.updateScroll(lastScrolledX, lastScrolledY);
  this.updateVehicle();
  // Overwrite! since movement can be so constant, do non-moving checks every update
  // if (!this.isMoving()) {
  this.updateNonmoving(wasMoving, sceneActive);
  // }
  this._followers.update();
};

// Override updateScroll to use position delta instead of velocity
// Position is captured BEFORE physics step in Scene_Map.update via saveScrollPositionForCamera()
// Then compared against current position AFTER physics/input updates
const _Game_Player_updateScroll = Game_Player.prototype.updateScroll;
Game_Player.prototype.updateScroll = function (lastScrolledX, lastScrolledY) {
  if (!this.body) {
    return _Game_Player_updateScroll.call(this, lastScrolledX, lastScrolledY);
  }

  // Use previous position captured BEFORE physics step
  const x1 = this._physickPrevScrollX ?? this.scrolledX();
  const y1 = this._physickPrevScrollY ?? this.scrolledY();
  const x2 = this.scrolledX();
  const y2 = this.scrolledY();

  // Calculate actual position change
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;

  // Scroll based on position delta
  if (deltaY > 0 && y2 > this.centerY()) {
    $gameMap.scrollDown(deltaY);
  }
  if (deltaX < 0 && x2 < this.centerX()) {
    $gameMap.scrollLeft(-deltaX);
  }
  if (deltaX > 0 && x2 > this.centerX()) {
    $gameMap.scrollRight(deltaX);
  }
  if (deltaY < 0 && y2 < this.centerY()) {
    $gameMap.scrollUp(-deltaY);
  }
};

/**
 * Create a rectangle shape for action button detection
 * Includes front half of player + full player length ahead
 * @returns {Rectangle} Detection rectangle in world coordinates
 */
Game_Player.prototype.createActionDetectionRect = function () {
  if (!this.body) return null;

  return createActionDetectionRect(this.direction(), this.body.position);
};

/**
 * Check if an event is eligible for action button triggering
 * @param {Game_Event} event - Event to check
 * @returns {boolean} True if event can be triggered
 */
Game_Player.prototype.isEventActionEligible = function (event) {
  // Must be a Game_Event
  if (!event || !event.isTriggerIn) {
    return false;
  }

  // Must have trigger type 0, 1, or 2
  if (!event.isTriggerIn([0, 1, 2])) {
    return false;
  }

  // Must be normal priority
  if (!event.isNormalPriority()) {
    return false;
  }

  // Must not be jumping
  if (event.isJumping()) {
    return false;
  }

  // Must have valid page with commands
  const list = event.list();
  if (!list || list.length <= 1) {
    return false;
  }

  return true;
};

/**
 * Find the closest eligible event from a list of bodies
 * @param {Body[]} bodies - Bodies detected by collision query
 * @returns {Game_Event|null} Closest eligible event, or null
 */
Game_Player.prototype.findClosestActionEvent = function (bodies) {
  if (!bodies || bodies.length === 0) {
    return null;
  }

  const playerPos = this.body.position;
  let closestEvent = null;
  let closestDistSq = Infinity;

  for (const body of bodies) {
    // Skip if not a character body
    if (!body.character) {
      continue;
    }

    const character = body.character;

    // Skip if not an eligible event
    if (!this.isEventActionEligible(character)) {
      continue;
    }

    // Calculate distance squared (faster than sqrt)
    const dx = body.position.x - playerPos.x;
    const dy = body.position.y - playerPos.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < closestDistSq) {
      closestDistSq = distSq;
      closestEvent = character;
    }
  }

  return closestEvent;
};

/**
 * Physics-based action button handling
 * Overrides tile-based vanilla implementation
 * Allows triggering while moving (no isMoving() check)
 */
Game_Player.prototype.triggerButtonAction = function () {
  if (Input.isTriggered('ok')) {
    // Priority 1: Vehicle boarding/alighting (preserve vanilla behavior)
    if (this.getOnOffVehicle()) {
      return true;
    }

    // Get physics world reference
    const world = SceneManager._scene && SceneManager._scene.world;
    if (!world || !this.body) {
      // Fallback to vanilla if no physics world
      return _Game_Player_triggerButtonAction.call(this);
    }

    // Priority 2: Check current tile for trigger 0 (action button only)
    // Query overlaps with player's own body
    const currentTileBodies = world.queryOverlapsWithBody(this.body);
    for (const body of currentTileBodies) {
      console.log(body);
      if (!body.character || body.character === this) {
        continue;
      }

      const event = body.character;
      if (
        event.isTriggerIn &&
        event.isTriggerIn([0]) &&
        event.isNormalPriority &&
        event.isNormalPriority() &&
        !event.isJumping()
      ) {
        event.start();
        return true;
      }
    }

    // Priority 3: Check facing direction for triggers 0, 1, 2
    const detectionRect = this.createActionDetectionRect();

    if (!detectionRect) {
      return false;
    }

    // Query world for overlapping bodies
    const bodies = world.queryOverlapsWithShape(detectionRect);

    // Filter and find closest eligible event
    const closestEvent = this.findClosestActionEvent(bodies);

    if (closestEvent) {
      closestEvent.start();
      return true;
    }
  }

  return false;
};

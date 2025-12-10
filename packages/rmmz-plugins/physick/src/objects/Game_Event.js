//-----------------------------------------------------------------------------
// Game_Event
//
// Physics integration for events - adds physics bodies to all map events

import {
  DEFAULT_CHARACTER_HEIGHT,
  DEFAULT_CHARACTER_RADIUS,
  DEFAULT_CHARACTER_WIDTH,
  CHARACTER_MATERIAL,
  EVENT_TRIGGERS,
} from '../constants';
import { COLLISION_START } from 'physics-engine';

// Override setupPageSettings to handle physics body when page changes
const _Game_Event_setupPageSettings = Game_Event.prototype.setupPageSettings;
Game_Event.prototype.setupPageSettings = function () {
  const hadBody = !!this.body;
  const oldPriority = this._priorityType;
  const oldImage = this.characterName();

  _Game_Event_setupPageSettings.call(this);

  // Recreate physics body if event changed significantly
  if (hadBody && SceneManager._scene && SceneManager._scene.world) {
    const newPriority = this._priorityType;
    const newImage = this.characterName();

    // If priority or image changed, recreate body
    if (oldPriority !== newPriority || oldImage !== newImage) {
      this.removePhysicsBody(SceneManager._scene.world);
      this.createEventPhysicsBody(SceneManager._scene.world);
    }
  }

  // Register collision handlers for touch triggers
  this.setupTouchTriggerHandlers();
};

// Override clearPageSettings to remove physics body
const _Game_Event_clearPageSettings = Game_Event.prototype.clearPageSettings;
Game_Event.prototype.clearPageSettings = function () {
  // Clear touch trigger handlers before removing body
  this.clearTouchTriggerHandlers();

  if (this.body && SceneManager._scene && SceneManager._scene.world) {
    this.removePhysicsBody(SceneManager._scene.world);
  }
  _Game_Event_clearPageSettings.call(this);
};

// Create physics body for event based on its properties
Game_Event.prototype.createEventPhysicsBody = function (world) {
  // Determine shape based on whether event has character image
  const hasImage = this.characterName() && this.characterName().length > 0;
  const shape = hasImage ? 'circle' : 'rectangle';

  // Create physics body
  this.createPhysicsBody(world, {
    shape: shape,
    radius: DEFAULT_CHARACTER_RADIUS,
    width: DEFAULT_CHARACTER_WIDTH,
    height: DEFAULT_CHARACTER_HEIGHT,
    mass: 1,
    material: CHARACTER_MATERIAL,
  });

  // Set sensor flag if event has through enabled
  if (this.isThrough()) {
    this.body.isSensor = true;
  }

  // Re-register touch trigger handlers after body creation
  this.setupTouchTriggerHandlers();
};

/**
 * Setup collision handlers for Player Touch (1) and Event Touch (2) triggers
 */
Game_Event.prototype.setupTouchTriggerHandlers = function () {
  // Clear previous handlers if any
  this.clearTouchTriggerHandlers();

  // Only register for Player Touch (1) or Event Touch (2)
  if (!this.body || !this.isTouchTrigger()) {
    return;
  }

  // Create handler function
  const touchHandler = (character) => {
    // Check if other character is the player
    if (character !== $gamePlayer) {
      return;
    }

    // Check RMMZ event trigger conditions
    if ($gameMap.isEventRunning()) {
      return; // Another event is already running
    }

    // Trigger the event!
    this.start();
  };

  // Register handler and store reference for cleanup
  this.onCollisionStart(touchHandler);
  this._touchTriggerHandler = touchHandler;
};

Game_Event.prototype.isTouchTrigger = function () {
  return [EVENT_TRIGGERS.PLAYER_TOUCH, EVENT_TRIGGERS.EVENT_TOUCH].includes(this._trigger);
};

/**
 * Clear touch trigger collision handlers
 */
Game_Event.prototype.clearTouchTriggerHandlers = function () {
  if (this._touchTriggerHandler && this.body) {
    // Remove handler from body's event emitter
    // this.offCollisionStart(this._touchTriggerHandler);
    this._touchTriggerHandler = null;
  }
};

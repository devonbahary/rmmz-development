//-----------------------------------------------------------------------------
// Game_Event
//
// Physics integration for events - adds physics bodies to all map events

import {
  DEFAULT_CHARACTER_HEIGHT,
  DEFAULT_CHARACTER_RADIUS,
  DEFAULT_CHARACTER_WIDTH,
  CHARACTER_MATERIAL,
  COLLISION_CATEGORIES,
} from '../constants';

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
};

// Override clearPageSettings to remove physics body
const _Game_Event_clearPageSettings = Game_Event.prototype.clearPageSettings;
Game_Event.prototype.clearPageSettings = function () {
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
};

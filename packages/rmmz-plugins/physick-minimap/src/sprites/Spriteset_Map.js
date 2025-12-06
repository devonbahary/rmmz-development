//=============================================================================
// Spriteset_Map
//=============================================================================
// Add physics minimap to upper layer (stays on screen, doesn't scroll)

import { Sprite_PhysicsMinimap } from './Sprite_PhysicsMinimap.js';

const _Spriteset_Map_createUpperLayer = Spriteset_Map.prototype.createUpperLayer;
Spriteset_Map.prototype.createUpperLayer = function () {
  _Spriteset_Map_createUpperLayer.call(this);
  this.createPhysicsMinimap();
};

Spriteset_Map.prototype.createPhysicsMinimap = function () {
  this._physicsMinimap = new Sprite_PhysicsMinimap();
  this.addChild(this._physicsMinimap);
};

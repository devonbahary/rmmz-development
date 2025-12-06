//=============================================================================
// Scene_Map
//=============================================================================

import { Body, World } from 'physics-engine';
import { DEFAULT_CHARACTER_RADIUS, CHARACTER_MATERIAL } from '../constants';
import { toWorldSize, getImpassableTileRects, getImpassableTileEdges } from '../utilities/map';

const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
Scene_Map.prototype.onMapLoaded = function () {
  _Scene_Map_onMapLoaded.call(this);
  this.initPhysick();
};

Scene_Map.prototype.initPhysick = function () {
  this.initPhysickWorld();
  this.initPhysickPlayer();
};

Scene_Map.prototype.initPhysickWorld = function () {
  const width = $gameMap.width();
  const height = $gameMap.height();

  console.log('is this even working??');
  this.world = new World({
    spatialCellSize: toWorldSize(1), // spatialCell should be 1 tile in size
    gravity: 10,
    timeStep: 1 / 60,
    positionIterations: 1,
    velocityIterations: 6,
  });

  this.createStaticBodies();
};

// Create static physics bodies
Scene_Map.prototype.createStaticBodies = function () {
  // fully impassable tiles
  for (const rect of getImpassableTileRects()) {
    const body = new Body(rect);
    body.setStatic();
    this.world.addBody(body);
  }

  // partially impassable tiles
  for (const edge of getImpassableTileEdges()) {
    const body = new Body(edge);
    body.setStatic();
    this.world.addBody(body);
  }
};

Scene_Map.prototype.initPhysickPlayer = function () {
  $gamePlayer.createPhysicsBody(this.world, {
    shape: 'circle',
    radius: DEFAULT_CHARACTER_RADIUS, // in game units (tiles)
    mass: 1,
    material: CHARACTER_MATERIAL, // Material(0.5, 0.8) - match test-app.js
  });
};

const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function () {
  if (this.world && $gamePlayer.body) {
    // Save position BEFORE physics step for camera delta calculation
    $gamePlayer.saveScrollPositionForCamera();

    // Step physics simulation
    const deltaTime = 1 / 60; // RMMZ runs at 60 FPS
    this.world.step(deltaTime);
  }

  // Call vanilla update (input processing + camera)
  _Scene_Map_update.call(this);
};

const _Scene_Map_terminate = Scene_Map.prototype.terminate;
Scene_Map.prototype.terminate = function () {
  // Clean up character physics bodies
  if (this.world) {
    if ($gamePlayer && $gamePlayer.body) {
      $gamePlayer.removePhysicsBody(this.world);
    }
    // Could also clean up event bodies if we add those later
  }

  _Scene_Map_terminate.call(this);
};

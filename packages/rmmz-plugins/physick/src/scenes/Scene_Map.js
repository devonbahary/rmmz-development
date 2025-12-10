//=============================================================================
// Scene_Map
//=============================================================================

import { Body, World } from 'physics-engine';
import { DEFAULT_CHARACTER_RADIUS, CHARACTER_MATERIAL, RMMZ_DELTA_TIME } from '../constants';
import { PLUGIN_GRAVITY } from '../index';
import { toWorldSize, getImpassableTileRects, getImpassableTileEdges } from '../utilities/map';

const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
Scene_Map.prototype.onMapLoaded = function () {
  _Scene_Map_onMapLoaded.call(this);
  this.initPhysicsEngine();
};

Scene_Map.prototype.initPhysicsEngine = function () {
  this.initWorld();
  this.initPhysickPlayer();
  this.initPhysickEvents();
};

Scene_Map.prototype.initWorld = function () {
  const width = $gameMap.width();
  const height = $gameMap.height();

  this.world = new World({
    spatialCellSize: toWorldSize(1), // spatialCell should be 1 tile in size
    gravity: PLUGIN_GRAVITY,
    timeStep: RMMZ_DELTA_TIME,
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

  // TODO: temporary for testing, delete me
  $gamePlayer.onCollisionStart((char) => console.log(`player collided with`, char));
  $gamePlayer.onCollisionActive((char) => console.log(`player continues to collide with`, char));
  $gamePlayer.onCollisionEnd((char) => console.log(`player ended collided with`, char));
};

Scene_Map.prototype.initPhysickEvents = function () {
  const events = $gameMap.events();
  for (const event of events) {
    if (event) {
      event.createEventPhysicsBody(this.world);
    }
  }
};

const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function () {
  if (this.world && $gamePlayer.body) {
    // Save position BEFORE physics step for camera delta calculation
    $gamePlayer.saveScrollPositionForCamera();

    // Step physics simulation
    this.world.step(RMMZ_DELTA_TIME);
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

    // Clean up event bodies
    const events = $gameMap.events();
    for (const event of events) {
      if (event && event.body) {
        event.removePhysicsBody(this.world);
      }
    }
  }

  _Scene_Map_terminate.call(this);
};

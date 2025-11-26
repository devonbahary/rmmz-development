/*:
 * @target MZ
 * @plugindesc Physics2D collision detection example plugin
 * @author Devon
 *
 * @help
 * Example plugin demonstrating the collision detection library.
 *
 * This plugin creates bouncing balls on the map using the physics engine.
 *
 * Note: This assumes the UMD build is loaded before this plugin.
 * Place physics2d.js in js/libs/ and load it in index.html:
 * <script src="js/libs/physics2d.js"></script>
 */

(() => {
  'use strict';

  // Access the global Physics2D library (from UMD build)
  if (typeof Physics2D === 'undefined') {
    console.error('Physics2D library not loaded! Make sure physics2d.js is loaded first.');
    return;
  }

  const { World, Body, BodyType, Circle, Rectangle, Vector, Material } = Physics2D;

  // Store physics world and sprite mappings
  let physicsWorld = null;
  const bodySprites = new Map();

  //-----------------------------------------------------------------------------
  // Scene_Map - Initialize physics world
  //-----------------------------------------------------------------------------

  const _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
  Scene_Map.prototype.createDisplayObjects = function () {
    _Scene_Map_createDisplayObjects.call(this);
    this.createPhysicsWorld();
  };

  Scene_Map.prototype.createPhysicsWorld = function () {
    // Create physics world
    physicsWorld = new World({
      gravity: new Vector(0, 300), // Lighter gravity for gameplay
      timeStep: 1 / 60,
      spatialCellSize: 100,
    });

    // Create ground (bottom of screen)
    const ground = new Body(
      new Rectangle(new Vector(0, Graphics.height - 20), new Vector(Graphics.width, Graphics.height)),
      BodyType.Static
    );
    physicsWorld.addBody(ground);

    // Create walls
    const leftWall = new Body(
      new Rectangle(new Vector(0, 0), new Vector(20, Graphics.height)),
      BodyType.Static
    );
    physicsWorld.addBody(leftWall);

    const rightWall = new Body(
      new Rectangle(
        new Vector(Graphics.width - 20, 0),
        new Vector(Graphics.width, Graphics.height)
      ),
      BodyType.Static
    );
    physicsWorld.addBody(rightWall);

    // Create some bouncing balls
    this.createBouncingBalls();
  };

  Scene_Map.prototype.createBouncingBalls = function () {
    for (let i = 0; i < 5; i++) {
      const x = 100 + Math.random() * (Graphics.width - 200);
      const y = 100 + Math.random() * 200;
      const radius = 10 + Math.random() * 20;

      // Create physics body
      const body = new Body(
        new Circle(new Vector(x, y), radius),
        BodyType.Dynamic,
        Material.BOUNCY
      );
      body.setMass(radius * 0.01);
      physicsWorld.addBody(body);

      // Create sprite for visualization
      const sprite = new Sprite(new Bitmap(radius * 2, radius * 2));
      const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
      sprite.bitmap.drawCircle(radius, radius, radius, color);
      sprite.anchor.x = 0.5;
      sprite.anchor.y = 0.5;

      this._spriteset._baseSprite.addChild(sprite);
      bodySprites.set(body.id, sprite);
    }
  };

  //-----------------------------------------------------------------------------
  // Scene_Map - Update physics
  //-----------------------------------------------------------------------------

  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function () {
    _Scene_Map_update.call(this);

    if (physicsWorld) {
      // Step physics simulation
      physicsWorld.step(1 / 60);

      // Update sprite positions from physics bodies
      for (const body of physicsWorld.getBodies()) {
        if (body.bodyType === BodyType.Dynamic) {
          const sprite = bodySprites.get(body.id);
          if (sprite) {
            sprite.x = body.position.x;
            sprite.y = body.position.y;
          }
        }
      }
    }
  };

  //-----------------------------------------------------------------------------
  // Scene_Map - Cleanup
  //-----------------------------------------------------------------------------

  const _Scene_Map_terminate = Scene_Map.prototype.terminate;
  Scene_Map.prototype.terminate = function () {
    _Scene_Map_terminate.call(this);

    // Clean up physics world
    if (physicsWorld) {
      physicsWorld.clearBodies();
      physicsWorld = null;
    }

    bodySprites.clear();
  };

  //-----------------------------------------------------------------------------
  // Plugin Command: Add Ball
  //-----------------------------------------------------------------------------

  PluginManager.registerCommand('Physics2DExample', 'addBall', (args) => {
    if (!physicsWorld) return;

    const x = Number(args.x) || $gamePlayer.screenX();
    const y = Number(args.y) || $gamePlayer.screenY();
    const radius = Number(args.radius) || 20;

    const body = new Body(new Circle(new Vector(x, y), radius), BodyType.Dynamic, Material.BOUNCY);
    body.setMass(radius * 0.01);
    physicsWorld.addBody(body);

    // Create sprite
    const sprite = new Sprite(new Bitmap(radius * 2, radius * 2));
    sprite.bitmap.drawCircle(radius, radius, radius, 'red');
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;

    SceneManager._scene._spriteset._baseSprite.addChild(sprite);
    bodySprites.set(body.id, sprite);
  });
})();

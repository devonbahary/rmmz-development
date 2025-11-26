/**
 * Basic physics simulation example
 * Demonstrates bouncing balls with different materials
 */

import { World, Body, BodyType, Circle, Rectangle, Vector, Material } from '../src';

// Create physics world
const world = new World({
  gravity: new Vector(0, 980), // 980 pixels/s² downward
  timeStep: 1 / 60,
  spatialCellSize: 100,
});

// Create ground
const ground = new Body(
  new Rectangle(new Vector(0, 500), new Vector(800, 520)),
  BodyType.Static
);
world.addBody(ground);

// Create left wall
const leftWall = new Body(
  new Rectangle(new Vector(0, 0), new Vector(20, 600)),
  BodyType.Static
);
world.addBody(leftWall);

// Create right wall
const rightWall = new Body(
  new Rectangle(new Vector(780, 0), new Vector(800, 600)),
  BodyType.Static
);
world.addBody(rightWall);

// Create bouncing balls with different materials
const bouncyBall = new Body(new Circle(new Vector(200, 100), 20), BodyType.Dynamic, Material.BOUNCY);
bouncyBall.setMass(1);
world.addBody(bouncyBall);

const heavyBall = new Body(new Circle(new Vector(400, 100), 30), BodyType.Dynamic, Material.HEAVY);
heavyBall.setMass(5);
world.addBody(heavyBall);

const lightBall = new Body(new Circle(new Vector(600, 100), 15), BodyType.Dynamic, Material.LIGHT);
lightBall.setMass(0.5);
world.addBody(lightBall);

// Simulation loop
console.log('Starting simulation...\n');

for (let frame = 0; frame < 120; frame++) {
  // Step physics (1/60th of a second)
  world.step(1 / 60);

  // Print state every 30 frames (every 0.5 seconds)
  if (frame % 30 === 0) {
    console.log(`Frame ${frame} (t=${world.getTime().toFixed(2)}s):`);
    console.log(
      `  Bouncy Ball: y=${bouncyBall.position.y.toFixed(1)}, vy=${bouncyBall.velocity.y.toFixed(1)}`
    );
    console.log(
      `  Heavy Ball:  y=${heavyBall.position.y.toFixed(1)}, vy=${heavyBall.velocity.y.toFixed(1)}`
    );
    console.log(
      `  Light Ball:  y=${lightBall.position.y.toFixed(1)}, vy=${lightBall.velocity.y.toFixed(1)}`
    );
    console.log('');
  }
}

console.log('Simulation complete!');

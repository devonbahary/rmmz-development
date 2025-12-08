/**
 * Collision Events Demo
 * Demonstrates the new collision event system with sensors
 */

import { World, Body, Circle, Rectangle, Vector } from '../src/index';

// Create a world
const world = new World({
  gravity: 0, // No gravity for this demo
  timeStep: 1 / 60
});

// Create a moving ball
const ball = new Body(new Circle(new Vector(0, 0), 10), undefined, 1.0);
ball.setVelocity(new Vector(50, 0)); // Moving right
world.addBody(ball);

// Create a sensor trigger zone
const sensor = new Body(Rectangle.fromCenter(new Vector(100, 0), 50, 50));
sensor.isSensor = true;
sensor.setStatic();
world.addBody(sensor);

// Create a solid wall
const wall = new Body(Rectangle.fromCenter(new Vector(200, 0), 20, 100));
wall.setStatic();
world.addBody(wall);

// Set up event listeners
console.log('Setting up collision event listeners...\n');

world.on('collision-start', (event) => {
  const bodyName = (body: Body) => body === ball ? 'ball' : body === sensor ? 'sensor' : 'wall';
  console.log(`[COLLISION START] ${bodyName(event.bodyA)} <-> ${bodyName(event.bodyB)}`);
  if (event.isSensor) {
    console.log('  └─ Sensor collision detected!');
  }
  if (event.manifold) {
    console.log(`  └─ Contact points: ${event.manifold.contacts.length}`);
  }
});

world.on('collision-active', (event) => {
  const bodyName = (body: Body) => body === ball ? 'ball' : body === sensor ? 'sensor' : 'wall';
  console.log(`[COLLISION ACTIVE] ${bodyName(event.bodyA)} <-> ${bodyName(event.bodyB)}`);
});

world.on('collision-end', (event) => {
  const bodyName = (body: Body) => body === ball ? 'ball' : body === sensor ? 'sensor' : 'wall';
  console.log(`[COLLISION END] ${bodyName(event.bodyA)} <-> ${bodyName(event.bodyB)}`);
  if (event.isSensor) {
    console.log('  └─ Left sensor zone!');
  }
});

// Run simulation
console.log('Running simulation...\n');
for (let i = 0; i < 250; i++) {
  world.step(1 / 60);

  // Log ball position every 40 frames
  if (i % 40 === 0) {
    console.log(`Frame ${i}: Ball position = (${ball.position.x.toFixed(1)}, ${ball.position.y.toFixed(1)})`);
  }
}

console.log('\nSimulation complete!');
console.log('\nExpected behavior:');
console.log('1. Ball enters sensor zone (~x=75) -> collision-start event');
console.log('2. Ball passes through sensor (sensor collision) -> collision-active events');
console.log('3. Ball exits sensor zone (~x=125) -> collision-end event');
console.log('4. Ball hits wall (~x=190) -> collision-start event');
console.log('5. Ball resolves collision (bounces/stops) -> collision-active/end events');

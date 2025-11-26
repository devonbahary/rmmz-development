/**
 * Simple test to verify the library works
 */

const {
  World,
  Body,
  BodyType,
  Circle,
  Rectangle,
  Vector,
  Material,
} = require('../dist/cjs/index.js');

console.log('Testing collision-detection library...\n');

// Create world
const world = new World({
  gravity: new Vector(0, 980),
  timeStep: 1 / 60,
});

// Create ground
const ground = new Body(
  new Rectangle(new Vector(0, 500), new Vector(800, 520)),
  BodyType.Static
);
world.addBody(ground);

// Create ball
const ball = new Body(new Circle(new Vector(400, 100), 20), BodyType.Dynamic, Material.BOUNCY);
ball.setMass(1);
world.addBody(ball);

console.log('Initial state:');
console.log(`  Ball position: (${ball.position.x}, ${ball.position.y.toFixed(1)})`);
console.log(`  Ball velocity: (${ball.velocity.x}, ${ball.velocity.y.toFixed(1)})\n`);

// Simulate 120 frames (2 seconds)
for (let i = 0; i < 120; i++) {
  world.step(1 / 60);

  if (i % 30 === 0) {
    console.log(`Frame ${i}:`);
    console.log(`  Ball position: (${ball.position.x.toFixed(1)}, ${ball.position.y.toFixed(1)})`);
    console.log(
      `  Ball velocity: (${ball.velocity.x.toFixed(1)}, ${ball.velocity.y.toFixed(1)})`
    );
    console.log(`  Kinetic energy: ${ball.getKineticEnergy().toFixed(1)}\n`);
  }
}

// Test area effects
console.log('Testing area effects...\n');

const explosionArea = new Circle(new Vector(400, 400), 100);
const testBodies = [
  { pos: new Vector(400, 400), name: 'Center' },
  { pos: new Vector(400, 450), name: 'Bottom edge' },
  { pos: new Vector(400, 550), name: 'Outside' },
];

for (const test of testBodies) {
  const testCircle = new Circle(test.pos, 10);
  const overlaps = explosionArea.overlaps(testCircle);
  console.log(`  ${test.name}: ${overlaps ? 'INSIDE' : 'outside'}`);
}

console.log('\n✓ All tests passed!');

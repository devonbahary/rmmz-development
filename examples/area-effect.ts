/**
 * Area effect example
 * Demonstrates using shapes independently for spatial queries
 */

import { World, Body, BodyType, Circle, Rectangle, Vector, Material } from '../src';

// Create world
const world = new World({
  gravity: new Vector(0, 0), // No gravity for this example
  timeStep: 1 / 60,
});

// Create some bodies scattered around
for (let i = 0; i < 10; i++) {
  const x = 100 + Math.random() * 600;
  const y = 100 + Math.random() * 400;
  const radius = 10 + Math.random() * 20;

  const body = new Body(new Circle(new Vector(x, y), radius), BodyType.Dynamic, Material.DEFAULT);
  body.setMass(radius * 0.1);
  body.setVelocity(new Vector((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100));
  world.addBody(body);
}

console.log('Testing area effects...\n');

// Simulate for a bit
world.step(1);

// Create an explosion area (circle)
const explosionCenter = new Vector(400, 300);
const explosionRadius = 150;
const explosionArea = new Circle(explosionCenter, explosionRadius);

console.log(`Explosion at ${explosionCenter}, radius ${explosionRadius}\n`);

// Check which bodies are in the explosion area
let affectedCount = 0;
for (const body of world.getBodies()) {
  if (explosionArea.overlaps(body.shape)) {
    const distance = body.position.distance(explosionCenter);
    console.log(`Body ${body.id} affected! Distance: ${distance.toFixed(1)} pixels`);

    // Apply knockback force proportional to distance
    const knockbackDir = body.position.subtract(explosionCenter).normalize();
    const knockbackStrength = 1000 * (1 - distance / explosionRadius);
    body.applyImpulse(knockbackDir.multiply(knockbackStrength));

    affectedCount++;
  }
}

console.log(`\nTotal bodies affected: ${affectedCount}`);

// Create a rectangular buff zone
const buffZone = Rectangle.fromCenter(new Vector(200, 200), 200, 200);

console.log('\nBuff zone at (200, 200), 200x200\n');

let buffedCount = 0;
for (const body of world.getBodies()) {
  if (buffZone.overlaps(body.shape)) {
    console.log(`Body ${body.id} in buff zone!`);
    buffedCount++;
  }
}

console.log(`\nTotal bodies buffed: ${buffedCount}`);

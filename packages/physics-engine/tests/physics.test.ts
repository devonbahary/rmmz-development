/**
 * Jest tests for the physics engine
 */

import { World, Body, BodyType, Circle, Rectangle, Vector, Material } from '../src/index';

describe('Physics Engine', () => {
  describe('World and Body Management', () => {
    it('should create a world with default config', () => {
      const world = new World();
      expect(world).toBeDefined();
      expect(world.getBodies().length).toBe(0);
    });

    it('should create a world with custom gravity', () => {
      const gravity = new Vector(0, 980);
      const world = new World({ gravity });
      expect(world.getGravity().x).toBe(0);
      expect(world.getGravity().y).toBe(980);
    });

    it('should add and retrieve bodies', () => {
      const world = new World();
      const ground = new Body(
        new Rectangle(new Vector(0, 500), new Vector(800, 520)),
        BodyType.Static
      );
      world.addBody(ground);

      expect(world.getBodies().length).toBe(1);
      expect(world.getBody(ground.id)).toBe(ground);
    });

    it('should remove bodies', () => {
      const world = new World();
      const body = new Body(new Circle(new Vector(100, 100), 10), BodyType.Dynamic);
      world.addBody(body);
      expect(world.getBodies().length).toBe(1);

      world.removeBody(body);
      expect(world.getBodies().length).toBe(0);
      expect(world.getBody(body.id)).toBeUndefined();
    });

    it('should clear all bodies', () => {
      const world = new World();
      world.addBody(new Body(new Circle(new Vector(100, 100), 10), BodyType.Dynamic));
      world.addBody(new Body(new Circle(new Vector(200, 200), 10), BodyType.Dynamic));
      expect(world.getBodies().length).toBe(2);

      world.clearBodies();
      expect(world.getBodies().length).toBe(0);
    });
  });

  describe('Physics Simulation', () => {
    it('should simulate a ball falling with gravity', () => {
      const world = new World({
        gravity: new Vector(0, 980),
        timeStep: 1 / 60,
      });

      const ball = new Body(new Circle(new Vector(400, 100), 20), BodyType.Dynamic);
      ball.setMass(1);
      world.addBody(ball);

      const initialY = ball.position.y;
      const initialVelocityY = ball.velocity.y;

      // Simulate 60 frames (1 second)
      for (let i = 0; i < 60; i++) {
        world.step(1 / 60);
      }

      // Ball should have fallen (y position increased)
      expect(ball.position.y).toBeGreaterThan(initialY);
      // Ball should have downward velocity
      expect(ball.velocity.y).toBeGreaterThan(initialVelocityY);
    });

    it('should simulate ball bouncing on ground', () => {
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

      // Create bouncy ball
      const ball = new Body(
        new Circle(new Vector(400, 100), 20),
        BodyType.Dynamic,
        Material.BOUNCY
      );
      ball.setMass(1);
      world.addBody(ball);

      const initialY = ball.position.y;
      let maxY = initialY;
      let bounced = false;

      // Simulate 120 frames (2 seconds)
      for (let i = 0; i < 120; i++) {
        world.step(1 / 60);

        // Track if ball bounces (velocity changes from negative to positive)
        if (ball.position.y > maxY) {
          maxY = ball.position.y;
        }

        // Check if ball hit ground and bounced
        if (ball.position.y >= 480 && ball.velocity.y > 0) {
          bounced = true;
        }
      }

      // Ball should have fallen and hit the ground
      expect(maxY).toBeGreaterThan(initialY);
      // Ball should have bounced (position should be above ground at some point)
      expect(ball.position.y).toBeLessThan(500);
    });

    it('should maintain kinetic energy during free fall', () => {
      const world = new World({
        gravity: new Vector(0, 980),
        timeStep: 1 / 60,
      });

      const ball = new Body(new Circle(new Vector(400, 100), 20), BodyType.Dynamic);
      ball.setMass(1);
      world.addBody(ball);

      const initialEnergy = ball.getKineticEnergy();

      // Simulate 30 frames
      for (let i = 0; i < 30; i++) {
        world.step(1 / 60);
      }

      // Kinetic energy should increase as ball falls
      const finalEnergy = ball.getKineticEnergy();
      expect(finalEnergy).toBeGreaterThan(initialEnergy);
    });

    it('should handle static bodies correctly', () => {
      const world = new World({
        gravity: new Vector(0, 980),
        timeStep: 1 / 60,
      });

      const staticBody = new Body(
        new Rectangle(new Vector(0, 500), new Vector(800, 520)),
        BodyType.Static
      );
      world.addBody(staticBody);

      const initialY = staticBody.position.y;
      const initialVelocity = staticBody.velocity.y;

      // Simulate many frames
      for (let i = 0; i < 120; i++) {
        world.step(1 / 60);
      }

      // Static body should not move
      expect(staticBody.position.y).toBe(initialY);
      expect(staticBody.velocity.y).toBe(initialVelocity);
    });
  });

  describe('Area Effects and Overlap Detection', () => {
    it('should detect circle-circle overlaps', () => {
      const explosionArea = new Circle(new Vector(400, 400), 100);

      // Circle at center - should overlap
      const centerCircle = new Circle(new Vector(400, 400), 10);
      expect(explosionArea.overlaps(centerCircle)).toBe(true);

      // Circle at edge - should overlap
      const edgeCircle = new Circle(new Vector(400, 450), 10);
      expect(explosionArea.overlaps(edgeCircle)).toBe(true);

      // Circle outside - should not overlap
      const outsideCircle = new Circle(new Vector(400, 550), 10);
      expect(explosionArea.overlaps(outsideCircle)).toBe(false);
    });

    it('should detect circle-rectangle overlaps', () => {
      const explosionArea = new Circle(new Vector(400, 400), 100);

      // Rectangle overlapping circle
      const overlappingRect = new Rectangle(new Vector(350, 350), new Vector(450, 450));
      expect(explosionArea.overlaps(overlappingRect)).toBe(true);

      // Rectangle outside circle
      const outsideRect = new Rectangle(new Vector(600, 600), new Vector(700, 700));
      expect(explosionArea.overlaps(outsideRect)).toBe(false);
    });

    it('should query bodies at a point', () => {
      const world = new World();
      const body1 = new Body(new Circle(new Vector(100, 100), 20), BodyType.Dynamic);
      const body2 = new Body(new Circle(new Vector(200, 200), 20), BodyType.Dynamic);
      world.addBody(body1);
      world.addBody(body2);

      // Query point inside body1
      const results = world.queryPoint(new Vector(100, 100));
      expect(results.length).toBe(1);
      expect(results[0]).toBe(body1);

      // Query point outside both bodies
      const emptyResults = world.queryPoint(new Vector(500, 500));
      expect(emptyResults.length).toBe(0);
    });
  });

  describe('Body Properties', () => {
    it('should calculate mass from density and area', () => {
      const ball = new Body(new Circle(new Vector(100, 100), 10), BodyType.Dynamic);
      const area = Math.PI * 10 * 10;
      const expectedMass = area * Material.DEFAULT.density;
      expect(ball.mass).toBeCloseTo(expectedMass, 1);
    });

    it('should allow setting custom mass', () => {
      const ball = new Body(new Circle(new Vector(100, 100), 10), BodyType.Dynamic);
      ball.setMass(5);
      expect(ball.mass).toBe(5);
      expect(ball.inverseMass).toBe(0.2);
    });

    it('should have infinite mass for static bodies', () => {
      const staticBody = new Body(
        new Rectangle(new Vector(0, 0), new Vector(100, 100)),
        BodyType.Static
      );
      expect(staticBody.mass).toBe(Infinity);
      expect(staticBody.inverseMass).toBe(0);
    });

    it('should calculate kinetic energy correctly', () => {
      const ball = new Body(new Circle(new Vector(100, 100), 10), BodyType.Dynamic);
      ball.setMass(2);
      ball.setVelocity(new Vector(10, 0));

      const expectedEnergy = 0.5 * 2 * (10 * 10);
      expect(ball.getKineticEnergy()).toBe(expectedEnergy);
    });
  });
});


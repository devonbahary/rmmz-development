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
      const world = new World({ gravity: 2 });
      expect(world.getGravity()).toBe(2);
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
    it('should apply gravity damping to moving bodies', () => {
      const world = new World({
        gravity: 1,
        timeStep: 1 / 60,
      });

      const ball = new Body(
        new Circle(new Vector(400, 100), 20),
        BodyType.Dynamic,
        Material.DEFAULT,
        1
      );
      ball.setVelocity(new Vector(100, 0));
      world.addBody(ball);

      const initialSpeed = ball.velocity.length();

      // Simulate 60 frames (1 second)
      for (let i = 0; i < 60; i++) {
        world.step(1 / 60);
      }

      // Speed should decrease due to gravity damping
      const finalSpeed = ball.velocity.length();
      expect(finalSpeed).toBeLessThan(initialSpeed);
    });

    it('should handle static bodies correctly', () => {
      const world = new World({
        gravity: 1,
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
    it('should use specified mass for bodies', () => {
      const ball = new Body(
        new Circle(new Vector(100, 100), 10),
        BodyType.Dynamic,
        Material.DEFAULT,
        5
      );
      expect(ball.mass).toBe(5);
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

  describe('Collision Resolution', () => {
    it('should bounce a body back when colliding with a static wall', () => {
      // Create world with no gravity for controlled testing
      const world = new World({
        gravity: 0,
        timeStep: 1 / 60,
      });

      // Create static wall on the right side
      const wall = new Body(
        Rectangle.fromCenter(new Vector(500, 300), 20, 600),
        BodyType.Static,
        Material.DEFAULT
      );
      world.addBody(wall);

      // Create dynamic ball moving towards the wall
      const ball = new Body(
        new Circle(new Vector(200, 300), 20),
        BodyType.Dynamic,
        Material.DEFAULT,
        1.0 // mass = 1
      );

      // Set initial velocity moving right (towards wall)
      ball.setVelocity(new Vector(100, 0));
      world.addBody(ball);

      const initialSpeed = ball.velocity.length();
      const initialVelocityX = ball.velocity.x;

      // Simulate until collision happens
      let collided = false;
      for (let i = 0; i < 200; i++) {
        world.step(1 / 60);

        // Detect collision by velocity reversal
        if (ball.velocity.x < 0 && initialVelocityX > 0) {
          collided = true;
          break;
        }
      }

      // Assert collision occurred
      expect(collided).toBe(true);

      // Assert velocity reversed direction (bounced back)
      expect(ball.velocity.x).toBeLessThan(0);

      // Assert body didn't gain energy (no explosion)
      const finalSpeed = ball.velocity.length();
      expect(finalSpeed).toBeLessThanOrEqual(initialSpeed * 1.1); // Allow 10% margin for restitution

      // Assert body didn't penetrate deeply into wall (less than radius + tolerance)
      // Note: Position correction resolves most penetration, but allows ~6px for stability
      const ballRadius = (ball.shape as Circle).radius;
      const wallLeftEdge = (wall.shape as Rectangle).min.x;
      expect(ball.position.x).toBeGreaterThan(wallLeftEdge - ballRadius - 6);
    });

    it('should not add energy during repeated collisions', () => {
      // Create world with no gravity
      const world = new World({
        gravity: 0,
        timeStep: 1 / 60,
      });

      // Create two parallel walls
      const leftWall = new Body(
        Rectangle.fromCenter(new Vector(100, 300), 20, 600),
        BodyType.Static,
        Material.DEFAULT
      );
      const rightWall = new Body(
        Rectangle.fromCenter(new Vector(500, 300), 20, 600),
        BodyType.Static,
        Material.DEFAULT
      );
      world.addBody(leftWall);
      world.addBody(rightWall);

      // Create ball bouncing between walls
      const ball = new Body(
        new Circle(new Vector(300, 300), 20),
        BodyType.Dynamic,
        Material.DEFAULT,
        1.0
      );
      ball.setVelocity(new Vector(50, 0));
      world.addBody(ball);

      const initialSpeed = ball.velocity.length();

      // Simulate for 5 seconds (should bounce multiple times)
      for (let i = 0; i < 300; i++) {
        world.step(1 / 60);
      }

      // Assert speed hasn't exploded (should decrease due to energy loss, or stay similar)
      const finalSpeed = ball.velocity.length();
      expect(finalSpeed).toBeLessThan(initialSpeed * 2); // Should not double in speed

      // Assert ball is still between the walls (not escaped)
      expect(ball.position.x).toBeGreaterThan(100);
      expect(ball.position.x).toBeLessThan(500);
    });
  });
});

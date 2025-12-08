import { World, Body, Circle, Rectangle, Vector, Material } from './dist/esm/index.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const debugDiv = document.getElementById('debug');
const gravitySlider = document.getElementById('gravity');
const gravityValue = document.getElementById('gravityValue');

// Create physics world with same config as RMMZ plugin
const world = new World({
  gravity: 20,
  timeStep: 1 / 60,
  positionIterations: 1,
  velocityIterations: 6,
});

// Create static walls (border)
const wallThickness = 20;
const walls = [
  // Top wall
  Rectangle.fromCenter(new Vector(400, 10), 800, wallThickness),
  // Bottom wall
  Rectangle.fromCenter(new Vector(400, 590), 800, wallThickness),
  // Left wall
  Rectangle.fromCenter(new Vector(10, 300), wallThickness, 600),
  // Right wall
  Rectangle.fromCenter(new Vector(790, 300), wallThickness, 600),
];

walls.forEach((wall) => {
  const body = new Body(wall, Material.DEFAULT);
  body.setStatic();
  world.addBody(body);
});

// Create static obstacles (red) - various shapes and sizes
const staticObstacles = [
  // Center large square
  Rectangle.fromCenter(new Vector(400, 300), 100, 100),
  // Small squares scattered around
  Rectangle.fromCenter(new Vector(150, 100), 40, 40),
  Rectangle.fromCenter(new Vector(650, 450), 50, 50),
  // Tall vertical rectangle
  Rectangle.fromCenter(new Vector(600, 200), 30, 120),
  // Wide horizontal rectangle
  Rectangle.fromCenter(new Vector(250, 450), 140, 35),
  // Static circles
  new Circle(new Vector(300, 150), 35),
  new Circle(new Vector(500, 400), 25),
  new Circle(new Vector(700, 100), 40),
  // More varied rectangles
  Rectangle.fromCenter(new Vector(100, 400), 60, 80),
  Rectangle.fromCenter(new Vector(550, 500), 70, 45),
];

staticObstacles.forEach((obstacle) => {
  const body = new Body(obstacle, Material.DEFAULT);
  body.setStatic();
  world.addBody(body);
});

// Create player (dynamic circle) with higher friction to make gravity damping visible
const playerShape = new Circle(new Vector(200, 200), 20);
const playerMaterial = new Material(0.5, 0.8); // Higher friction for noticeable damping
const player = new Body(playerShape, playerMaterial, 1.0);
world.addBody(player);

// Create additional dynamic bodies (blue) - various shapes and sizes
const dynamicBodies = [
  // Dynamic circles of various sizes
  new Circle(new Vector(350, 100), 15),
  new Circle(new Vector(450, 150), 25),
  new Circle(new Vector(200, 350), 18),
  new Circle(new Vector(600, 300), 22),
  new Circle(new Vector(150, 500), 12),
  // Dynamic rectangles
  Rectangle.fromCenter(new Vector(500, 250), 40, 40),
  Rectangle.fromCenter(new Vector(300, 400), 35, 50),
  Rectangle.fromCenter(new Vector(650, 350), 45, 30),
  Rectangle.fromCenter(new Vector(400, 450), 25, 60),
  // More dynamic circles
  new Circle(new Vector(100, 250), 20),
  new Circle(new Vector(700, 450), 17),
];

const dynamicBodyObjects = [];
const dynamicMaterial = new Material(0.5, 0.8); // Higher friction for visible gravity effects
dynamicBodies.forEach((shape) => {
  const body = new Body(shape, dynamicMaterial, 1.0);
  world.addBody(body);
  dynamicBodyObjects.push(body);
});

// Create sensor bodies (green) - trigger zones that detect but don't block
const sensorShapes = [
  // Large sensor zone in top-left (clear area)
  Rectangle.fromCenter(new Vector(80, 150), 80, 120),
  // Circular sensor zone in top-center (clear area)
  new Circle(new Vector(520, 85), 60),
  // Small sensor rectangle near bottom-left (clear area)
  Rectangle.fromCenter(new Vector(200, 540), 100, 40),
  // Medium sensor circle on the right-middle (clear area)
  new Circle(new Vector(710, 280), 45),
];

const sensorBodies = [];
sensorShapes.forEach((shape) => {
  const body = new Body(shape, Material.DEFAULT);
  body.isSensor = true;
  body.setStatic();
  world.addBody(body);
  sensorBodies.push(body);
});

// Subscribe to collision events
world.on('collision-start', (event) => {
  console.log('[COLLISION-START]', {
    bodyA: event.bodyA.id,
    bodyB: event.bodyB.id,
    isSensor: event.isSensor,
    contactCount: event.manifold?.contacts.length,
  });
});

world.on('collision-active', (event) => {
  console.log('[COLLISION-ACTIVE]', {
    bodyA: event.bodyA.id,
    bodyB: event.bodyB.id,
    isSensor: event.isSensor,
    contactCount: event.manifold?.contacts.length,
  });
});

world.on('collision-end', (event) => {
  console.log('[COLLISION-END]', {
    bodyA: event.bodyA.id,
    bodyB: event.bodyB.id,
    isSensor: event.isSensor,
  });
});

// Input handling
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

window.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
    e.preventDefault();
  }
});

// Gravity control
gravitySlider.addEventListener('input', (e) => {
  const gravity = parseFloat(e.target.value);
  world.setGravity(gravity);
  gravityValue.textContent = gravity.toFixed(1);
});

// Apply movement impulses (same as RMMZ plugin)
function handleInput() {
  const moveSpeed = 200; // pixels per second
  const impulseMultiplier = 20; // Same 5x multiplier as RMMZ plugin

  let vx = 0;
  let vy = 0;

  if (keys.ArrowLeft) vx -= moveSpeed;
  if (keys.ArrowRight) vx += moveSpeed;
  if (keys.ArrowUp) vy -= moveSpeed;
  if (keys.ArrowDown) vy += moveSpeed;

  if (vx !== 0 || vy !== 0) {
    const velocity = new Vector(vx, vy);
    const impulse = velocity
      .normalize()
      .multiply(moveSpeed * player.mass * impulseMultiplier * (1 / 60));
    player.applyMovement(impulse);
  }
}

// Render function
function render() {
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw all bodies
  for (const body of world.getBodies()) {
    // Color sensor bodies green (transparent), static bodies red, dynamic bodies blue
    if (body.isSensor) {
      ctx.fillStyle = 'rgba(74, 255, 74, 0.3)'; // Semi-transparent green
      ctx.strokeStyle = '#2acc2a';
    } else if (body.isStatic()) {
      ctx.fillStyle = '#ff4a4a';
      ctx.strokeStyle = '#cc2a2a';
    } else {
      ctx.fillStyle = '#4a9eff';
      ctx.strokeStyle = '#2a7eff';
    }
    ctx.lineWidth = 2;

    const shape = body.shape;
    if (shape.type === 'Circle') {
      ctx.beginPath();
      ctx.arc(shape.center.x, shape.center.y, shape.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw velocity vector
      if (body === player) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shape.center.x, shape.center.y);
        ctx.lineTo(shape.center.x + body.velocity.x * 0.1, shape.center.y + body.velocity.y * 0.1);
        ctx.stroke();
      }
    } else if (shape.type === 'Rectangle') {
      const min = shape.min;
      const max = shape.max;
      ctx.fillRect(min.x, min.y, max.x - min.x, max.y - min.y);
      ctx.strokeRect(min.x, min.y, max.x - min.x, max.y - min.y);
    }
  }

  // Debug info
  const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
  debugDiv.innerHTML = `
        Gravity: ${world.getGravity().toFixed(1)}<br>
        Position: (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)})<br>
        Velocity: (${player.velocity.x.toFixed(1)}, ${player.velocity.y.toFixed(1)})<br>
        Speed: ${speed.toFixed(1)}
    `;
}

// Game loop
function gameLoop() {
  handleInput();
  world.step(1 / 60);
  render();
  requestAnimationFrame(gameLoop);
}

gameLoop();

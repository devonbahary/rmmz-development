import { World, Body, BodyType, Circle, Rectangle, Vector, Material } from './dist/esm/index.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const debugDiv = document.getElementById('debug');

// Create physics world with same config as RMMZ plugin
const world = new World({
    gravity: 1,
    timeStep: 1/60,
    positionIterations: 1,
    velocityIterations: 6
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
    // Center obstacle
    Rectangle.fromCenter(new Vector(400, 300), 100, 100)
];

walls.forEach(wall => {
    const body = new Body(wall, BodyType.Static, Material.DEFAULT);
    world.addBody(body);
});

// Create player (dynamic circle)
const playerShape = new Circle(new Vector(200, 200), 20);
const player = new Body(playerShape, BodyType.Dynamic, Material.DEFAULT, 1.0);
world.addBody(player);

// Input handling
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
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

// Apply movement impulses (same as RMMZ plugin)
function handleInput() {
    const moveSpeed = 200; // pixels per second
    const impulseMultiplier = 5; // Same 5x multiplier as RMMZ plugin

    let vx = 0;
    let vy = 0;

    if (keys.ArrowLeft) vx -= moveSpeed;
    if (keys.ArrowRight) vx += moveSpeed;
    if (keys.ArrowUp) vy -= moveSpeed;
    if (keys.ArrowDown) vy += moveSpeed;

    if (vx !== 0 || vy !== 0) {
        const velocity = new Vector(vx, vy);
        const impulse = velocity.multiply(player.mass * impulseMultiplier * (1/60));
        player.applyImpulse(impulse);
    }
}

// Render function
function render() {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all bodies
    for (const body of world.getBodies()) {
        if (body === player) {
            ctx.fillStyle = '#4a9eff';
            ctx.strokeStyle = '#2a7eff';
        } else {
            ctx.fillStyle = '#ff4a4a';
            ctx.strokeStyle = '#cc2a2a';
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
                ctx.lineTo(
                    shape.center.x + body.velocity.x * 0.1,
                    shape.center.y + body.velocity.y * 0.1
                );
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
    const speed = Math.sqrt(player.velocity.x**2 + player.velocity.y**2);
    debugDiv.innerHTML = `
        Position: (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)})<br>
        Velocity: (${player.velocity.x.toFixed(1)}, ${player.velocity.y.toFixed(1)})<br>
        Speed: ${speed.toFixed(1)}
    `;
}

// Game loop
function gameLoop() {
    handleInput();
    world.step(1/60);
    render();
    requestAnimationFrame(gameLoop);
}

gameLoop();

//=============================================================================
// Physics Manager
//=============================================================================

// Initialize physics world
window.initializePhysics = function () {
  if (window._Physick_world) return;

  const { World } = window.CollisionDetection;
  const gravity = Number(window._Physick_params.gravity || 980);

  window._Physick_world = new World({
    gravity: gravity,
    timeStep: 1 / 60,
    spatialCellSize: 48, // RMMZ tile size
  });

  console.log(`PhysicsManager: Initialized (gravity=${gravity})`);
};

// Update physics simulation
window.updatePhysics = function () {
  if (window._Physick_world) {
    window._Physick_world.step(1 / 60);
  }
};

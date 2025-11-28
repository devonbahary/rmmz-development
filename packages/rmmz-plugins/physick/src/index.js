// Import collision-detection library
import * as CollisionDetection from 'physics-engine';

// Make available globally (required for RMMZ environment)
window.CollisionDetection = CollisionDetection;

// Get plugin parameters
window._Physick_params = PluginManager.parameters('Physick');

// Shared state (accessible via window for modules)
window._Physick_world = null;

// Import modules (they access shared state via window)
import './managers/PhysicsManager.js';
import './scenes/Scene_Map.js';
import './sprites/Sprite_Body.js';

// Export public API
window.PhysicsWorld = () => window._Physick_world;

console.log('Physick plugin loaded');

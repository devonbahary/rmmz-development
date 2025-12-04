// Import collision-detection library
import * as CollisionDetection from 'physics-engine';

// Make available globally (*may be* required for RMMZ environment; TODO: confirm this)
window.CollisionDetection = CollisionDetection;

const pluginParams = PluginManager.parameters('Physick');

import './objects/Game_CharacterBase';
import './objects/Game_Player';
import './scenes/Scene_Map';

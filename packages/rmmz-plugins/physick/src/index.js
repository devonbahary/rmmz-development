// Import collision-detection library
import * as CollisionDetection from 'physics-engine';

// Load and parse plugin parameters
const pluginParams = PluginManager.parameters('Physick');
export const PLUGIN_GRAVITY = Number(pluginParams.gravity) || 20;

import './objects/Game_CharacterBase';
import './objects/Game_Player';
import './objects/Game_Event';
import './scenes/Scene_Map';

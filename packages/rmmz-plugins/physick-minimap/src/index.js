/*:
 * @target MZ
 * @plugindesc Physics Minimap - Displays physics bodies in real-time
 * @author Devon
 * @url https://github.com/yourusername/rmmz-development
 * @orderAfter Physick
 *
 * @help PhysickMinimap.js
 *
 * This plugin requires the Physick plugin to be loaded first.
 *
 * Displays a minimap in the top-right corner showing:
 * - Red shapes for static physics bodies (walls, obstacles)
 * - White shapes for dynamic bodies (characters, moving objects)
 *
 * The minimap auto-scales to fit the entire map and updates in real-time.
 *
 * No configuration needed - just load the plugin after Physick.
 */

// Import sprite classes in order (Sprite_PhysicsMinimap must come before Spriteset_Map)
import './sprites/Sprite_PhysicsMinimap';
import './sprites/Spriteset_Map';

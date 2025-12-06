//=============================================================================
// PhysickMinimap.js
// Version: 0.1.0
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Physics Minimap - Displays physics bodies in real-time
 * @author Devon
 * @orderAfter Physick
 *
 * @param minimapSize
 * @text Minimap Size
 * @type number
 * @default 200
 * @desc Size of the minimap in pixels (width and height)
 *
 * @param minimapX
 * @text X Position
 * @type number
 * @default -1
 * @desc X position of minimap (-1 = auto, top-right corner)
 *
 * @param minimapY
 * @text Y Position
 * @type number
 * @default 10
 * @desc Y position of minimap (pixels from top)
 *
 * @param staticBodyColor
 * @text Static Body Color
 * @type string
 * @default red
 * @desc Color for static bodies (walls, obstacles)
 *
 * @param dynamicBodyColor
 * @text Dynamic Body Color
 * @type string
 * @default white
 * @desc Color for dynamic bodies (characters, moving objects)
 *
 * @help PhysickMinimap.js - Physics Minimap
 *
 * This plugin displays a minimap in the top-right corner showing all
 * physics bodies from the Physick physics engine.
 *
 * REQUIREMENTS:
 * - Physick.js must be loaded before this plugin
 * - Use the Plugin Manager to ensure Physick is ordered first
 *
 * FEATURES:
 * - Real-time display of all physics bodies
 * - Red shapes for static bodies (walls, obstacles)
 * - White shapes for dynamic bodies (characters, moving objects)
 * - Auto-scales to fit the entire map
 * - Configurable size and colors
 *
 * No additional setup required - the minimap will appear automatically
 * when you enter a map with physics bodies.
 */


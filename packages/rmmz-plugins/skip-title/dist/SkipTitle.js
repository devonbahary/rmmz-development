//=============================================================================
// SkipTitle.js
// Version: 0.1.0
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Allows skipping the title screen via a plugin parameter.
 * @author Devon
 *
 * @param SkipTitle
 * @text Skip Title Screen
 * @type boolean
 * @default false
 * @desc When enabled, the game will start immediately instead of showing the title screen.
 *
 * @help SkipTitle.js
 *
 * This plugin allows you to skip the title screen and start the game directly.
 * Useful for debugging or automated testing.
 *
 * Usage:
 * - Enable the "Skip Title Screen" parameter in the Plugin Manager
 * - The game will start immediately on launch
 */
(() => {
  // src/index.js
  var pluginName = "SkipTitle";
  var parameters = PluginManager.parameters(pluginName);
  var skipTitle = parameters.SkipTitle === "true";
  if (skipTitle) {
    Scene_Boot.prototype.startNormalGame = function() {
      this.checkPlayerLocation();
      DataManager.setupNewGame();
      SceneManager.goto(Scene_Map);
    };
  }
})();

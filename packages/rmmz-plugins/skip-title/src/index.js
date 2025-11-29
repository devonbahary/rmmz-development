// Get plugin parameters from RMMZ Plugin Manager
const pluginName = 'SkipTitle';
const parameters = PluginManager.parameters(pluginName);
const skipTitle = parameters.SkipTitle === 'true';

if (skipTitle) {
  // Override Scene_Boot to skip the title screen
  Scene_Boot.prototype.startNormalGame = function () {
    this.checkPlayerLocation();
    DataManager.setupNewGame();
    SceneManager.goto(Scene_Map);
  };
}

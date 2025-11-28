//=============================================================================
// Scene_Map Extensions
//=============================================================================

const _Scene_Map_create = Scene_Map.prototype.create;
Scene_Map.prototype.create = function() {
  _Scene_Map_create.call(this);
  window.initializePhysics();
};

const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
  _Scene_Map_update.call(this);
  window.updatePhysics();
};

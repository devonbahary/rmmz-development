//-----------------------------------------------------------------------------
// Game_Player
//
// The game object class for the player. It contains event starting
// determinants and map scrolling functions.

const _Game_Player_initMembers = Game_Player.prototype.initMembers;
Game_Player.prototype.initMembers = function () {
  _Game_Player_initMembers.call(this);
  this._physickPrevScrollX = null;
  this._physickPrevScrollY = null;
};

Game_Player.prototype.saveScrollPositionForCamera = function () {
  if (!this.body) return;
  this._physickPrevScrollX = this.scrolledX();
  this._physickPrevScrollY = this.scrolledY();
};

Game_Player.prototype.getInputDirection = function () {
  return Input.dir8; // override from dir4
};

// Override moveByInput to remove the isMoving() check
const _Game_Player_moveByInput = Game_Player.prototype.moveByInput;
Game_Player.prototype.moveByInput = function () {
  if (!$gamePlayer.body) {
    return _Game_Player_moveByInput.call(this);
  }

  // override isMoving check; allow input even when moving (physics-based)
  if (this.canMove()) {
    let direction = this.getInputDirection();
    if (direction > 0) {
      $gameTemp.clearDestination();
    } else if ($gameTemp.isDestinationValid()) {
      const x = $gameTemp.destinationX();
      const y = $gameTemp.destinationY();
      direction = this.findDirectionTo(x, y);
    }
    if (direction > 0) {
      this.executeMove(direction);
    }
  }
};

// Override updateScroll to use position delta instead of velocity
// Position is captured BEFORE physics step in Scene_Map.update via saveScrollPositionForCamera()
// Then compared against current position AFTER physics/input updates
const _Game_Player_updateScroll = Game_Player.prototype.updateScroll;
Game_Player.prototype.updateScroll = function (lastScrolledX, lastScrolledY) {
  if (!this.body) {
    return _Game_Player_updateScroll.call(this, lastScrolledX, lastScrolledY);
  }

  // Use previous position captured BEFORE physics step
  const x1 = this._physickPrevScrollX ?? this.scrolledX();
  const y1 = this._physickPrevScrollY ?? this.scrolledY();
  const x2 = this.scrolledX();
  const y2 = this.scrolledY();

  // Calculate actual position change
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;

  // Scroll based on position delta
  if (deltaY > 0 && y2 > this.centerY()) {
    $gameMap.scrollDown(deltaY);
  }
  if (deltaX < 0 && x2 < this.centerX()) {
    $gameMap.scrollLeft(-deltaX);
  }
  if (deltaX > 0 && x2 > this.centerX()) {
    $gameMap.scrollRight(deltaX);
  }
  if (deltaY < 0 && y2 < this.centerY()) {
    $gameMap.scrollUp(-deltaY);
  }
};

//=============================================================================
// Sprite_PhysicsMinimap
//=============================================================================
// Displays a minimap of all physics bodies in the top-right corner

function Sprite_PhysicsMinimap() {
  this.initialize(...arguments);
}

Sprite_PhysicsMinimap.prototype = Object.create(Sprite.prototype);
Sprite_PhysicsMinimap.prototype.constructor = Sprite_PhysicsMinimap;

Sprite_PhysicsMinimap.prototype.initialize = function () {
  Sprite.prototype.initialize.call(this);
  this._minimapSize = 200;
  this.createBitmap();
};

Sprite_PhysicsMinimap.prototype.createBitmap = function () {
  this.bitmap = new Bitmap(this._minimapSize, this._minimapSize);
};

Sprite_PhysicsMinimap.prototype.update = function () {
  Sprite.prototype.update.call(this);
  this.updatePosition();
  this.redraw();
};

Sprite_PhysicsMinimap.prototype.updatePosition = function () {
  // Position in top-right corner with 10px margin
  this.x = Graphics.width - this.bitmap.width - 10;
  this.y = 10;
};

Sprite_PhysicsMinimap.prototype.redraw = function () {
  const bitmap = this.bitmap;
  const scene = SceneManager._scene;

  if (!scene || !scene.world) return;

  const world = scene.world;

  // Clear previous frame
  bitmap.clear();

  // Draw semi-transparent black background
  bitmap.fillRect(0, 0, bitmap.width, bitmap.height, 'rgba(0, 0, 0, 0.7)');

  // Calculate scaling to fit entire map in minimap
  const mapWidth = $gameMap.width() * $gameMap.tileWidth();
  const mapHeight = $gameMap.height() * $gameMap.tileHeight();
  const scale = Math.min(
    (bitmap.width - 4) / mapWidth, // -4 for 2px border
    (bitmap.height - 4) / mapHeight
  );
  const offsetX = 2; // Border offset
  const offsetY = 2;

  // Draw all physics bodies
  const bodies = world.getBodies();
  for (const body of bodies) {
    const color = body.isStatic() ? 'red' : 'white';
    const shape = body.shape;

    // Scale position to minimap coordinates
    const x = offsetX + body.position.x * scale;
    const y = offsetY + body.position.y * scale;

    if (shape.type === 'Circle') {
      const radius = Math.max(1, shape.radius * scale); // Minimum 1px
      bitmap.drawCircle(x, y, radius, color);
    } else if (shape.type === 'Rectangle') {
      const width = Math.max(1, shape.width * scale);
      const height = Math.max(1, shape.height * scale);
      bitmap.fillRect(x - width / 2, y - height / 2, width, height, color);
    }
  }

  // Draw border
  bitmap.strokeRect(0, 0, bitmap.width, bitmap.height, 'white');
};

export { Sprite_PhysicsMinimap };

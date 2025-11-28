//=============================================================================
// Sprite_Body - Custom Physics Body Sprite
//=============================================================================

window.Sprite_Body = class extends Sprite {
  initialize(body) {
    super.initialize();
    this._body = body;
    this.createBitmap();
  }

  createBitmap() {
    const { Circle } = window.CollisionDetection;
    if (this._body.shape instanceof Circle) {
      const radius = this._body.shape.radius;
      this.bitmap = new Bitmap(radius * 2, radius * 2);
      this.bitmap.drawCircle(radius, radius, radius, '#ffffff');
    }
  }

  update() {
    super.update();
    if (this._body) {
      this.x = this._body.position.x;
      this.y = this._body.position.y;
    }
  }
};

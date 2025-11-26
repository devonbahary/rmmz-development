/**
 * Physical material properties
 * Defines how bodies interact during collisions
 */
export class Material {
  /**
   * @param density Mass per unit area (kg/pixel²)
   * @param restitution Bounciness (0 = perfectly inelastic, 1 = perfectly elastic)
   * @param friction Surface friction coefficient (0 = frictionless, 1 = high friction)
   */
  constructor(
    public density: number = 1.0,
    public restitution: number = 0.5,
    public friction: number = 0.3
  ) {}

  // Preset materials
  static readonly DEFAULT = new Material(1.0, 0.5, 0.3);
  static readonly BOUNCY = new Material(1.0, 0.9, 0.1);
  static readonly HEAVY = new Material(10.0, 0.1, 0.8);
  static readonly LIGHT = new Material(0.1, 0.7, 0.2);
  static readonly FRICTIONLESS = new Material(1.0, 0.5, 0.0);
}

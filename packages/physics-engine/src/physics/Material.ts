/**
 * Physical material properties
 * Defines how bodies interact during collisions
 */
export class Material {
  /**
   * @param restitution Bounciness (0 = perfectly inelastic, 1 = perfectly elastic)
   * @param friction Surface friction coefficient (0 = frictionless, 1 = high friction)
   */
  constructor(
    public restitution: number = 0.5,
    public friction: number = 0.3
  ) {}

  // Preset materials
  static readonly DEFAULT = new Material(0.5, 0.3);
  static readonly BOUNCY = new Material(0.9, 0.1);
  static readonly HEAVY = new Material(0.1, 0.8);
  static readonly LIGHT = new Material(0.7, 0.2);
  static readonly FRICTIONLESS = new Material(0.5, 0.0);
}

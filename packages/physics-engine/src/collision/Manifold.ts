import { Body } from '../physics/Body';
import { Contact } from './Contact';

/**
 * Collision manifold containing all contacts between two bodies
 */
export class Manifold {
  contacts: Contact[] = [];
  restitution: number;
  friction: number;

  constructor(
    public bodyA: Body,
    public bodyB: Body
  ) {
    this.restitution = this.calculateRestitution();
    this.friction = this.calculateFriction();
  }

  addContact(contact: Contact): void {
    this.contacts.push(contact);
  }

  clear(): void {
    this.contacts = [];
  }

  /**
   * Combined restitution (use maximum for more bouncy behavior)
   */
  private calculateRestitution(): number {
    return Math.max(this.bodyA.material.restitution, this.bodyB.material.restitution);
  }

  /**
   * Combined friction (geometric mean)
   */
  private calculateFriction(): number {
    return Math.sqrt(this.bodyA.material.friction * this.bodyB.material.friction);
  }
}

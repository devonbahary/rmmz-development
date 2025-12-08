import { Body } from '../physics/Body';
import { AABB } from '../geometry/AABB';
import { BroadPhase } from './BroadPhase';
import { Pair } from './Pair';

/**
 * Grid-based spatial hash for broad-phase collision detection
 * O(1) insertion/removal, efficient for uniformly distributed objects
 */
export class SpatialHash implements BroadPhase {
  private grid: Map<string, Set<Body>>;
  private bodyToCells: Map<number, Set<string>>;

  constructor(private cellSize: number = 100) {
    this.grid = new Map();
    this.bodyToCells = new Map();
  }

  insert(body: Body): void {
    const aabb = body.getAABB();
    const cells = this.getCellsForAABB(aabb);

    this.bodyToCells.set(body.id, new Set(cells));

    for (const cellKey of cells) {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, new Set());
      }
      this.grid.get(cellKey)!.add(body);
    }
  }

  remove(body: Body): void {
    const cells = this.bodyToCells.get(body.id);
    if (!cells) {
      return;
    }

    for (const cellKey of cells) {
      const cell = this.grid.get(cellKey);
      if (cell) {
        cell.delete(body);
        // Clean up empty cells
        if (cell.size === 0) {
          this.grid.delete(cellKey);
        }
      }
    }

    this.bodyToCells.delete(body.id);
  }

  update(body: Body): void {
    // Simple update: remove and reinsert
    this.remove(body);
    this.insert(body);
  }

  clear(): void {
    this.grid.clear();
    this.bodyToCells.clear();
  }

  query(body: Body): Body[] {
    const aabb = body.getAABB();
    return this.queryRegion(aabb).filter((b) => b.id !== body.id);
  }

  queryRegion(aabb: AABB): Body[] {
    const cells = this.getCellsForAABB(aabb);
    const bodiesSet = new Set<Body>();

    for (const cellKey of cells) {
      const cell = this.grid.get(cellKey);
      if (cell) {
        for (const body of cell) {
          bodiesSet.add(body);
        }
      }
    }

    return Array.from(bodiesSet);
  }

  getPairs(): Pair[] {
    const pairs = new Map<number, Pair>();

    // For each cell
    for (const cell of this.grid.values()) {
      const bodies = Array.from(cell);

      // Check all pairs within the cell
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const bodyA = bodies[i];
          const bodyB = bodies[j];

          // Skip if bodies can't detect collisions (allows sensors through)
          if (!bodyA.canDetectCollisionWith(bodyB)) {
            continue;
          }

          // Use hash to avoid duplicates
          const hash = Pair.hash(bodyA, bodyB);
          if (!pairs.has(hash)) {
            pairs.set(hash, new Pair(bodyA, bodyB));
          }
        }
      }
    }

    return Array.from(pairs.values());
  }

  /**
   * Get all cell keys that the AABB overlaps
   */
  private getCellsForAABB(aabb: AABB): string[] {
    const minCellX = Math.floor(aabb.min.x / this.cellSize);
    const minCellY = Math.floor(aabb.min.y / this.cellSize);
    const maxCellX = Math.floor(aabb.max.x / this.cellSize);
    const maxCellY = Math.floor(aabb.max.y / this.cellSize);

    const cells: string[] = [];

    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        cells.push(`${x},${y}`);
      }
    }

    return cells;
  }

  // ===== Debug / Utility =====

  getCellCount(): number {
    return this.grid.size;
  }

  getMaxBodiesPerCell(): number {
    let max = 0;
    for (const cell of this.grid.values()) {
      max = Math.max(max, cell.size);
    }
    return max;
  }
}

//=============================================================================
// Physick.js
// Version: 0.1.0
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Physics engine for RPG Maker MZ
 * @author Devon
 *
 * @param gravity
 * @text Gravity
 * @type number
 * @default 980
 * @desc Z-axis gravity acceleration (pixels/s²)
 *
 * @help Physick.js - Physics Engine
 *
 * This plugin adds realistic physics simulation to RMMZ using the
 * collision-detection library. All dependencies are bundled.
 *
 * No additional files required!
 *
 * Access from other plugins:
 *   const world = window.PhysicsWorld();
 */
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // ../../physics-engine/dist/esm/index.js
  var esm_exports = {};
  __export(esm_exports, {
    AABB: () => AABB,
    Body: () => Body,
    BodyType: () => BodyType,
    Circle: () => Circle,
    Contact: () => Contact,
    DEFAULT_WORLD_CONFIG: () => DEFAULT_WORLD_CONFIG,
    EPSILON: () => EPSILON,
    EPSILON_SQ: () => EPSILON_SQ,
    Manifold: () => Manifold,
    Material: () => Material,
    Pair: () => Pair,
    Rectangle: () => Rectangle,
    Shape: () => Shape,
    ShapeType: () => ShapeType,
    SpatialHash: () => SpatialHash,
    Vector: () => Vector,
    World: () => World,
    approxEqual: () => approxEqual,
    approxZero: () => approxZero,
    clamp: () => clamp
  });

  // ../../physics-engine/dist/esm/spatial/Pair.js
  var _Pair = class _Pair {
    constructor(bodyA, bodyB) {
      this.bodyA = bodyA;
      this.bodyB = bodyB;
    }
    static hash(bodyA, bodyB) {
      const [a, b] = bodyA.id < bodyB.id ? [bodyA.id, bodyB.id] : [bodyB.id, bodyA.id];
      return (a + b) * (a + b + 1) / 2 + b;
    }
    getHash() {
      return _Pair.hash(this.bodyA, this.bodyB);
    }
  };
  __name(_Pair, "Pair");
  var Pair = _Pair;

  // ../../physics-engine/dist/esm/spatial/SpatialHash.js
  var _SpatialHash = class _SpatialHash {
    constructor(cellSize = 100) {
      this.cellSize = cellSize;
      this.grid = /* @__PURE__ */ new Map();
      this.bodyToCells = /* @__PURE__ */ new Map();
    }
    insert(body) {
      const aabb = body.getAABB();
      const cells = this.getCellsForAABB(aabb);
      this.bodyToCells.set(body.id, new Set(cells));
      for (const cellKey of cells) {
        if (!this.grid.has(cellKey)) {
          this.grid.set(cellKey, /* @__PURE__ */ new Set());
        }
        this.grid.get(cellKey).add(body);
      }
    }
    remove(body) {
      const cells = this.bodyToCells.get(body.id);
      if (!cells) {
        return;
      }
      for (const cellKey of cells) {
        const cell = this.grid.get(cellKey);
        if (cell) {
          cell.delete(body);
          if (cell.size === 0) {
            this.grid.delete(cellKey);
          }
        }
      }
      this.bodyToCells.delete(body.id);
    }
    update(body) {
      this.remove(body);
      this.insert(body);
    }
    clear() {
      this.grid.clear();
      this.bodyToCells.clear();
    }
    query(body) {
      const aabb = body.getAABB();
      return this.queryRegion(aabb).filter((b) => b.id !== body.id);
    }
    queryRegion(aabb) {
      const cells = this.getCellsForAABB(aabb);
      const bodiesSet = /* @__PURE__ */ new Set();
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
    getPairs() {
      const pairs = /* @__PURE__ */ new Map();
      for (const cell of this.grid.values()) {
        const bodies = Array.from(cell);
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const bodyA = bodies[i];
            const bodyB = bodies[j];
            if (!bodyA.canCollideWith(bodyB)) {
              continue;
            }
            const hash = Pair.hash(bodyA, bodyB);
            if (!pairs.has(hash)) {
              pairs.set(hash, new Pair(bodyA, bodyB));
            }
          }
        }
      }
      return Array.from(pairs.values());
    }
    getCellsForAABB(aabb) {
      const minCellX = Math.floor(aabb.min.x / this.cellSize);
      const minCellY = Math.floor(aabb.min.y / this.cellSize);
      const maxCellX = Math.floor(aabb.max.x / this.cellSize);
      const maxCellY = Math.floor(aabb.max.y / this.cellSize);
      const cells = [];
      for (let x = minCellX; x <= maxCellX; x++) {
        for (let y = minCellY; y <= maxCellY; y++) {
          cells.push(`${x},${y}`);
        }
      }
      return cells;
    }
    getCellCount() {
      return this.grid.size;
    }
    getMaxBodiesPerCell() {
      let max = 0;
      for (const cell of this.grid.values()) {
        max = Math.max(max, cell.size);
      }
      return max;
    }
  };
  __name(_SpatialHash, "SpatialHash");
  var SpatialHash = _SpatialHash;

  // ../../physics-engine/dist/esm/geometry/Shape.js
  var ShapeType;
  (function(ShapeType2) {
    ShapeType2["Circle"] = "Circle";
    ShapeType2["Rectangle"] = "Rectangle";
  })(ShapeType || (ShapeType = {}));
  var _Shape = class _Shape {
  };
  __name(_Shape, "Shape");
  var Shape = _Shape;

  // ../../physics-engine/dist/esm/collision/Manifold.js
  var _Manifold = class _Manifold {
    constructor(bodyA, bodyB) {
      this.bodyA = bodyA;
      this.bodyB = bodyB;
      this.contacts = [];
      this.restitution = this.calculateRestitution();
      this.friction = this.calculateFriction();
    }
    addContact(contact) {
      this.contacts.push(contact);
    }
    clear() {
      this.contacts = [];
    }
    calculateRestitution() {
      return Math.max(this.bodyA.material.restitution, this.bodyB.material.restitution);
    }
    calculateFriction() {
      return Math.sqrt(this.bodyA.material.friction * this.bodyB.material.friction);
    }
  };
  __name(_Manifold, "Manifold");
  var Manifold = _Manifold;

  // ../../physics-engine/dist/esm/collision/Contact.js
  var _Contact = class _Contact {
    constructor(point, normal, penetration) {
      this.point = point;
      this.normal = normal;
      this.penetration = penetration;
    }
  };
  __name(_Contact, "Contact");
  var Contact = _Contact;

  // ../../physics-engine/dist/esm/math/MathUtils.js
  var EPSILON = 1e-10;
  var EPSILON_SQ = EPSILON * EPSILON;
  function approxEqual(a, b, epsilon = EPSILON) {
    return Math.abs(a - b) < epsilon;
  }
  __name(approxEqual, "approxEqual");
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  __name(clamp, "clamp");
  function approxZero(value, epsilon = EPSILON) {
    return Math.abs(value) < epsilon;
  }
  __name(approxZero, "approxZero");

  // ../../physics-engine/dist/esm/math/Vector.js
  var _Vector = class _Vector {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    static zero() {
      return new _Vector(0, 0);
    }
    static one() {
      return new _Vector(1, 1);
    }
    static fromAngle(angle, length = 1) {
      return new _Vector(Math.cos(angle) * length, Math.sin(angle) * length);
    }
    clone() {
      return new _Vector(this.x, this.y);
    }
    add(v) {
      return new _Vector(this.x + v.x, this.y + v.y);
    }
    subtract(v) {
      return new _Vector(this.x - v.x, this.y - v.y);
    }
    multiply(scalar) {
      return new _Vector(this.x * scalar, this.y * scalar);
    }
    divide(scalar) {
      if (approxZero(scalar)) {
        return _Vector.zero();
      }
      return new _Vector(this.x / scalar, this.y / scalar);
    }
    addMut(v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    }
    subtractMut(v) {
      this.x -= v.x;
      this.y -= v.y;
      return this;
    }
    multiplyMut(scalar) {
      this.x *= scalar;
      this.y *= scalar;
      return this;
    }
    divideMut(scalar) {
      if (approxZero(scalar)) {
        this.x = 0;
        this.y = 0;
        return this;
      }
      this.x /= scalar;
      this.y /= scalar;
      return this;
    }
    dot(v) {
      return this.x * v.x + this.y * v.y;
    }
    cross(v) {
      return this.x * v.y - this.y * v.x;
    }
    lengthSquared() {
      return this.x * this.x + this.y * this.y;
    }
    length() {
      return Math.sqrt(this.lengthSquared());
    }
    normalize() {
      const lenSq = this.lengthSquared();
      if (lenSq < EPSILON_SQ) {
        return _Vector.zero();
      }
      const len = Math.sqrt(lenSq);
      return new _Vector(this.x / len, this.y / len);
    }
    normalizeMut() {
      const lenSq = this.lengthSquared();
      if (lenSq < EPSILON_SQ) {
        this.x = 0;
        this.y = 0;
        return this;
      }
      const len = Math.sqrt(lenSq);
      this.x /= len;
      this.y /= len;
      return this;
    }
    distance(v) {
      const dx = this.x - v.x;
      const dy = this.y - v.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
    distanceSquared(v) {
      const dx = this.x - v.x;
      const dy = this.y - v.y;
      return dx * dx + dy * dy;
    }
    angle() {
      return Math.atan2(this.y, this.x);
    }
    rotate(angle) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return new _Vector(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }
    rotateMut(angle) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const newX = this.x * cos - this.y * sin;
      const newY = this.x * sin + this.y * cos;
      this.x = newX;
      this.y = newY;
      return this;
    }
    perpendicular() {
      return new _Vector(-this.y, this.x);
    }
    project(onto) {
      const ontoLenSq = onto.lengthSquared();
      if (ontoLenSq < EPSILON_SQ) {
        return _Vector.zero();
      }
      const scalar = this.dot(onto) / ontoLenSq;
      return onto.multiply(scalar);
    }
    reflect(normal) {
      const dotProduct = this.dot(normal);
      return this.subtract(normal.multiply(2 * dotProduct));
    }
    lerp(v, t) {
      return new _Vector(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t);
    }
    isZero() {
      return this.lengthSquared() < EPSILON_SQ;
    }
    equals(v, epsilon = EPSILON) {
      return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
    }
    toString() {
      return `Vector(${this.x.toFixed(3)}, ${this.y.toFixed(3)})`;
    }
  };
  __name(_Vector, "Vector");
  var Vector = _Vector;

  // ../../physics-engine/dist/esm/collision/detectors/CircleCircle.js
  function detectCircleCircle(bodyA, bodyB) {
    const circleA = bodyA.shape;
    const circleB = bodyB.shape;
    const distSq = bodyA.position.distanceSquared(bodyB.position);
    const radiusSum = circleA.radius + circleB.radius;
    const radiusSumSq = radiusSum * radiusSum;
    if (distSq >= radiusSumSq) {
      return null;
    }
    const manifold = new Manifold(bodyA, bodyB);
    const distance = Math.sqrt(distSq);
    if (distance < EPSILON) {
      const normal2 = new Vector(1, 0);
      const contactPoint2 = bodyA.position.clone();
      const contact2 = new Contact(contactPoint2, normal2, radiusSum);
      manifold.addContact(contact2);
      return manifold;
    }
    const normal = bodyB.position.subtract(bodyA.position).divide(distance);
    const penetration = radiusSum - distance;
    const contactPoint = bodyA.position.add(normal.multiply(circleA.radius));
    const contact = new Contact(contactPoint, normal, penetration);
    manifold.addContact(contact);
    return manifold;
  }
  __name(detectCircleCircle, "detectCircleCircle");

  // ../../physics-engine/dist/esm/collision/detectors/CircleRectangle.js
  function detectCircleRectangle(bodyA, bodyB) {
    const circle = bodyA.shape;
    const rect = bodyB.shape;
    const closest = new Vector(clamp(bodyA.position.x, rect.min.x, rect.max.x), clamp(bodyA.position.y, rect.min.y, rect.max.y));
    const offset = bodyA.position.subtract(closest);
    const distSq = offset.lengthSquared();
    const radiusSq = circle.radius * circle.radius;
    if (distSq > radiusSq + EPSILON) {
      return null;
    }
    const manifold = new Manifold(bodyA, bodyB);
    const distance = Math.sqrt(distSq);
    if (distance < EPSILON) {
      const distToLeft = bodyA.position.x - rect.min.x;
      const distToRight = rect.max.x - bodyA.position.x;
      const distToTop = bodyA.position.y - rect.min.y;
      const distToBottom = rect.max.y - bodyA.position.y;
      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      let normal2;
      let penetration2;
      if (minDist === distToLeft) {
        normal2 = new Vector(-1, 0);
        penetration2 = circle.radius + distToLeft;
      } else if (minDist === distToRight) {
        normal2 = new Vector(1, 0);
        penetration2 = circle.radius + distToRight;
      } else if (minDist === distToTop) {
        normal2 = new Vector(0, -1);
        penetration2 = circle.radius + distToTop;
      } else {
        normal2 = new Vector(0, 1);
        penetration2 = circle.radius + distToBottom;
      }
      const contactPoint2 = bodyA.position.subtract(normal2.multiply(circle.radius));
      const contact2 = new Contact(contactPoint2, normal2, penetration2);
      manifold.addContact(contact2);
      return manifold;
    }
    const normal = offset.divide(distance);
    const penetration = circle.radius - distance;
    const contactPoint = bodyA.position.subtract(normal.multiply(circle.radius));
    const contact = new Contact(contactPoint, normal, penetration);
    manifold.addContact(contact);
    return manifold;
  }
  __name(detectCircleRectangle, "detectCircleRectangle");

  // ../../physics-engine/dist/esm/collision/detectors/RectangleRectangle.js
  function detectRectangleRectangle(bodyA, bodyB) {
    const rectA = bodyA.shape;
    const rectB = bodyB.shape;
    const overlapX = Math.min(rectA.max.x, rectB.max.x) - Math.max(rectA.min.x, rectB.min.x);
    const overlapY = Math.min(rectA.max.y, rectB.max.y) - Math.max(rectA.min.y, rectB.min.y);
    if (overlapX <= EPSILON || overlapY <= EPSILON) {
      return null;
    }
    const manifold = new Manifold(bodyA, bodyB);
    let normal;
    let penetration;
    if (overlapX < overlapY) {
      penetration = overlapX;
      if (bodyB.position.x > bodyA.position.x) {
        normal = new Vector(1, 0);
      } else {
        normal = new Vector(-1, 0);
      }
    } else {
      penetration = overlapY;
      if (bodyB.position.y > bodyA.position.y) {
        normal = new Vector(0, 1);
      } else {
        normal = new Vector(0, -1);
      }
    }
    const contactX = (Math.max(rectA.min.x, rectB.min.x) + Math.min(rectA.max.x, rectB.max.x)) / 2;
    const contactY = (Math.max(rectA.min.y, rectB.min.y) + Math.min(rectA.max.y, rectB.max.y)) / 2;
    const contactPoint = new Vector(contactX, contactY);
    const contact = new Contact(contactPoint, normal, penetration);
    manifold.addContact(contact);
    return manifold;
  }
  __name(detectRectangleRectangle, "detectRectangleRectangle");

  // ../../physics-engine/dist/esm/collision/CollisionDetector.js
  var _CollisionDetector = class _CollisionDetector {
    constructor() {
      this.detectors = /* @__PURE__ */ new Map();
      this.registerDetectors();
    }
    detect(bodyA, bodyB) {
      const key = this.getDetectorKey(bodyA.shape.type, bodyB.shape.type);
      const detector = this.detectors.get(key);
      if (!detector) {
        console.warn(`No collision detector for ${bodyA.shape.type} vs ${bodyB.shape.type}`);
        return null;
      }
      return detector(bodyA, bodyB);
    }
    registerDetectors() {
      this.detectors.set(this.getDetectorKey(ShapeType.Circle, ShapeType.Circle), detectCircleCircle);
      this.detectors.set(this.getDetectorKey(ShapeType.Circle, ShapeType.Rectangle), detectCircleRectangle);
      this.detectors.set(this.getDetectorKey(ShapeType.Rectangle, ShapeType.Circle), (bodyA, bodyB) => {
        const manifold = detectCircleRectangle(bodyB, bodyA);
        if (manifold) {
          const reversedManifold = new Manifold(bodyA, bodyB);
          manifold.contacts.forEach((contact) => {
            reversedManifold.addContact({
              point: contact.point,
              normal: contact.normal.multiply(-1),
              penetration: contact.penetration
            });
          });
          return reversedManifold;
        }
        return null;
      });
      this.detectors.set(this.getDetectorKey(ShapeType.Rectangle, ShapeType.Rectangle), detectRectangleRectangle);
    }
    getDetectorKey(typeA, typeB) {
      return `${typeA}_${typeB}`;
    }
  };
  __name(_CollisionDetector, "CollisionDetector");
  var CollisionDetector = _CollisionDetector;

  // ../../physics-engine/dist/esm/collision/CollisionResolver.js
  var _CollisionResolver = class _CollisionResolver {
    constructor() {
      this.positionIterations = 8;
      this.velocityIterations = 10;
      this.positionSlop = 0.05;
      this.positionCorrectionPercent = 0.8;
    }
    resolve(manifolds, _dt) {
      for (let i = 0; i < this.velocityIterations; i++) {
        for (const manifold of manifolds) {
          this.resolveVelocity(manifold);
        }
      }
      for (let i = 0; i < this.positionIterations; i++) {
        for (const manifold of manifolds) {
          this.resolvePosition(manifold);
        }
      }
    }
    resolveVelocity(manifold) {
      const bodyA = manifold.bodyA;
      const bodyB = manifold.bodyB;
      for (const contact of manifold.contacts) {
        const relativeVelocity = bodyB.velocity.subtract(bodyA.velocity);
        const velocityAlongNormal = relativeVelocity.dot(contact.normal);
        if (velocityAlongNormal > -EPSILON) {
          continue;
        }
        const invMassSum = bodyA.inverseMass + bodyB.inverseMass;
        if (invMassSum < EPSILON) {
          continue;
        }
        const j = -(1 + manifold.restitution) * velocityAlongNormal / invMassSum;
        const impulse = contact.normal.multiply(j);
        bodyA.velocity = bodyA.velocity.subtract(impulse.multiply(bodyA.inverseMass));
        bodyB.velocity = bodyB.velocity.add(impulse.multiply(bodyB.inverseMass));
        this.applyFriction(manifold, contact, j);
      }
    }
    applyFriction(manifold, contact, normalImpulse) {
      const bodyA = manifold.bodyA;
      const bodyB = manifold.bodyB;
      const relativeVelocity = bodyB.velocity.subtract(bodyA.velocity);
      const tangent = relativeVelocity.subtract(contact.normal.multiply(relativeVelocity.dot(contact.normal)));
      if (tangent.lengthSquared() < EPSILON * EPSILON) {
        return;
      }
      const tangentNormalized = tangent.normalize();
      const invMassSum = bodyA.inverseMass + bodyB.inverseMass;
      const jt = -relativeVelocity.dot(tangentNormalized) / invMassSum;
      const maxFriction = Math.abs(normalImpulse) * manifold.friction;
      const frictionImpulse = Math.max(-maxFriction, Math.min(jt, maxFriction));
      const frictionVector = tangentNormalized.multiply(frictionImpulse);
      bodyA.velocity = bodyA.velocity.subtract(frictionVector.multiply(bodyA.inverseMass));
      bodyB.velocity = bodyB.velocity.add(frictionVector.multiply(bodyB.inverseMass));
    }
    resolvePosition(manifold) {
      const bodyA = manifold.bodyA;
      const bodyB = manifold.bodyB;
      for (const contact of manifold.contacts) {
        const invMassSum = bodyA.inverseMass + bodyB.inverseMass;
        if (invMassSum < EPSILON) {
          continue;
        }
        const correction = Math.max(contact.penetration - this.positionSlop, 0);
        if (correction < EPSILON) {
          continue;
        }
        const correctionAmount = correction * this.positionCorrectionPercent;
        const correctionVector = contact.normal.multiply(correctionAmount);
        bodyA.position = bodyA.position.subtract(correctionVector.multiply(bodyA.inverseMass / invMassSum));
        bodyB.position = bodyB.position.add(correctionVector.multiply(bodyB.inverseMass / invMassSum));
      }
    }
  };
  __name(_CollisionResolver, "CollisionResolver");
  var CollisionResolver = _CollisionResolver;

  // ../../physics-engine/dist/esm/world/WorldConfig.js
  var DEFAULT_WORLD_CONFIG = {
    gravity: new Vector(0, 980),
    timeStep: 1 / 60,
    maxSubSteps: 8,
    spatialCellSize: 100,
    positionIterations: 8,
    velocityIterations: 10
  };

  // ../../physics-engine/dist/esm/world/World.js
  var _World = class _World {
    constructor(config = {}) {
      this.config = __spreadValues(__spreadValues({}, DEFAULT_WORLD_CONFIG), config);
      this.bodies = /* @__PURE__ */ new Map();
      this.broadPhase = new SpatialHash(this.config.spatialCellSize);
      this.detector = new CollisionDetector();
      this.resolver = new CollisionResolver();
      this.resolver.positionIterations = this.config.positionIterations;
      this.resolver.velocityIterations = this.config.velocityIterations;
      this.time = 0;
      this.accumulator = 0;
      this.currentCollisions = /* @__PURE__ */ new Set();
    }
    addBody(body) {
      this.bodies.set(body.id, body);
      this.broadPhase.insert(body);
    }
    removeBody(body) {
      this.bodies.delete(body.id);
      this.broadPhase.remove(body);
    }
    getBody(id) {
      return this.bodies.get(id);
    }
    getBodies() {
      return Array.from(this.bodies.values());
    }
    clearBodies() {
      this.bodies.clear();
      this.broadPhase.clear();
    }
    step(deltaTime) {
      const clampedDelta = Math.min(deltaTime, this.config.maxSubSteps * this.config.timeStep);
      this.accumulator += clampedDelta;
      let steps = 0;
      while (this.accumulator >= this.config.timeStep && steps < this.config.maxSubSteps) {
        this.fixedStep(this.config.timeStep);
        this.accumulator -= this.config.timeStep;
        this.time += this.config.timeStep;
        steps++;
      }
    }
    fixedStep(dt) {
      for (const body of this.bodies.values()) {
        body.integrate(dt, this.config.gravity);
      }
      for (const body of this.bodies.values()) {
        this.broadPhase.update(body);
      }
      const pairs = this.broadPhase.getPairs();
      const manifolds = [];
      this.currentCollisions.clear();
      for (const pair of pairs) {
        const manifold = this.detector.detect(pair.bodyA, pair.bodyB);
        if (manifold && manifold.contacts.length > 0) {
          manifolds.push(manifold);
          const collisionKey = this.getCollisionKey(pair.bodyA, pair.bodyB);
          this.currentCollisions.add(collisionKey);
        }
      }
      if (manifolds.length > 0) {
        this.resolver.resolve(manifolds, dt);
      }
      for (const body of this.bodies.values()) {
        body.clearForces();
      }
    }
    queryPoint(point) {
      const bodies = this.getBodies();
      return bodies.filter((body) => body.shape.contains(point));
    }
    queryRegion(aabb) {
      return this.broadPhase.queryRegion(aabb);
    }
    getTime() {
      return this.time;
    }
    getGravity() {
      return this.config.gravity.clone();
    }
    setGravity(gravity) {
      this.config.gravity = gravity.clone();
    }
    getCollisionKey(bodyA, bodyB) {
      const [a, b] = bodyA.id < bodyB.id ? [bodyA.id, bodyB.id] : [bodyB.id, bodyA.id];
      return (a + b) * (a + b + 1) / 2 + b;
    }
  };
  __name(_World, "World");
  var World = _World;

  // ../../physics-engine/dist/esm/physics/Material.js
  var _Material = class _Material {
    constructor(density = 1, restitution = 0.5, friction = 0.3) {
      this.density = density;
      this.restitution = restitution;
      this.friction = friction;
    }
  };
  __name(_Material, "Material");
  var Material = _Material;
  Material.DEFAULT = new Material(1, 0.5, 0.3);
  Material.BOUNCY = new Material(1, 0.9, 0.1);
  Material.HEAVY = new Material(10, 0.1, 0.8);
  Material.LIGHT = new Material(0.1, 0.7, 0.2);
  Material.FRICTIONLESS = new Material(1, 0.5, 0);

  // ../../physics-engine/dist/esm/physics/Body.js
  var BodyType;
  (function(BodyType2) {
    BodyType2["Static"] = "Static";
    BodyType2["Dynamic"] = "Dynamic";
    BodyType2["Kinematic"] = "Kinematic";
  })(BodyType || (BodyType = {}));
  var bodyIdCounter = 0;
  var _Body = class _Body {
    constructor(shape, bodyType, material = Material.DEFAULT) {
      this.shape = shape;
      this.bodyType = bodyType;
      this.material = material;
      this.id = bodyIdCounter++;
      this.position = shape.getCenter();
      this.velocity = Vector.zero();
      this.acceleration = Vector.zero();
      this.forceAccumulator = Vector.zero();
      this.isSensor = false;
      this.layer = 1;
      this.mask = 4294967295;
      if (bodyType === BodyType.Static) {
        this.mass = Infinity;
        this.inverseMass = 0;
      } else {
        const area = shape.getArea();
        this.mass = area * material.density;
        this.inverseMass = this.mass > EPSILON ? 1 / this.mass : 0;
      }
    }
    setMass(mass) {
      if (this.bodyType === BodyType.Static) {
        return;
      }
      this.mass = mass;
      this.inverseMass = mass > EPSILON ? 1 / mass : 0;
    }
    setDensity(density) {
      this.material.density = density;
      const area = this.shape.getArea();
      this.setMass(area * density);
    }
    applyForce(force) {
      if (this.bodyType !== BodyType.Dynamic) {
        return;
      }
      this.forceAccumulator.addMut(force);
    }
    applyImpulse(impulse) {
      if (this.bodyType !== BodyType.Dynamic) {
        return;
      }
      this.velocity.addMut(impulse.multiply(this.inverseMass));
    }
    clearForces() {
      this.forceAccumulator.x = 0;
      this.forceAccumulator.y = 0;
    }
    integrate(dt, gravity) {
      if (this.bodyType !== BodyType.Dynamic) {
        return;
      }
      const accel = this.forceAccumulator.multiply(this.inverseMass).add(gravity);
      this.velocity.addMut(accel.multiply(dt));
      if (this.velocity.lengthSquared() < EPSILON_SQ) {
        this.velocity.x = 0;
        this.velocity.y = 0;
      }
      this.position.addMut(this.velocity.multiply(dt));
    }
    getAABB() {
      return this.shape.getAABB();
    }
    getKineticEnergy() {
      if (this.bodyType !== BodyType.Dynamic) {
        return 0;
      }
      return 0.5 * this.mass * this.velocity.lengthSquared();
    }
    canCollideWith(other) {
      if (this.isSensor || other.isSensor) {
        return false;
      }
      return !!(this.mask & other.layer && other.mask & this.layer);
    }
    setPosition(position) {
      this.position = position.clone();
    }
    setVelocity(velocity) {
      this.velocity = velocity.clone();
    }
  };
  __name(_Body, "Body");
  var Body = _Body;

  // ../../physics-engine/dist/esm/geometry/AABB.js
  var _AABB = class _AABB {
    constructor(min, max) {
      this.min = min;
      this.max = max;
    }
    static fromCenterAndSize(center, width, height) {
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      return new _AABB(new Vector(center.x - halfWidth, center.y - halfHeight), new Vector(center.x + halfWidth, center.y + halfHeight));
    }
    getCenter() {
      return new Vector((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2);
    }
    getWidth() {
      return this.max.x - this.min.x;
    }
    getHeight() {
      return this.max.y - this.min.y;
    }
    overlaps(other) {
      return this.min.x < other.max.x && this.max.x > other.min.x && this.min.y < other.max.y && this.max.y > other.min.y;
    }
    contains(point) {
      return point.x >= this.min.x && point.x <= this.max.x && point.y >= this.min.y && point.y <= this.max.y;
    }
    merge(other) {
      return new _AABB(new Vector(Math.min(this.min.x, other.min.x), Math.min(this.min.y, other.min.y)), new Vector(Math.max(this.max.x, other.max.x), Math.max(this.max.y, other.max.y)));
    }
    clone() {
      return new _AABB(this.min.clone(), this.max.clone());
    }
  };
  __name(_AABB, "AABB");
  var AABB = _AABB;

  // ../../physics-engine/dist/esm/geometry/Circle.js
  var _Circle = class _Circle extends Shape {
    constructor(center, radius) {
      super();
      this.center = center;
      this.radius = radius;
      this.type = ShapeType.Circle;
    }
    getAABB() {
      return new AABB(new Vector(this.center.x - this.radius, this.center.y - this.radius), new Vector(this.center.x + this.radius, this.center.y + this.radius));
    }
    contains(point) {
      const distSq = this.center.distanceSquared(point);
      return distSq <= this.radius * this.radius + EPSILON_SQ;
    }
    getCenter() {
      return this.center.clone();
    }
    getArea() {
      return Math.PI * this.radius * this.radius;
    }
    overlaps(other) {
      if (other.type === ShapeType.Circle) {
        const otherCircle = other;
        const distSq = this.center.distanceSquared(otherCircle.center);
        const radiusSum = this.radius + otherCircle.radius;
        return distSq < radiusSum * radiusSum;
      } else {
        return other.overlaps(this);
      }
    }
  };
  __name(_Circle, "Circle");
  var Circle = _Circle;

  // ../../physics-engine/dist/esm/geometry/Rectangle.js
  var _Rectangle = class _Rectangle extends Shape {
    constructor(min, max) {
      super();
      this.min = min;
      this.max = max;
      this.type = ShapeType.Rectangle;
    }
    static fromCenter(center, width, height) {
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      return new _Rectangle(new Vector(center.x - halfWidth, center.y - halfHeight), new Vector(center.x + halfWidth, center.y + halfHeight));
    }
    get width() {
      return this.max.x - this.min.x;
    }
    get height() {
      return this.max.y - this.min.y;
    }
    getAABB() {
      return new AABB(this.min.clone(), this.max.clone());
    }
    contains(point) {
      return point.x >= this.min.x - EPSILON && point.x <= this.max.x + EPSILON && point.y >= this.min.y - EPSILON && point.y <= this.max.y + EPSILON;
    }
    getCenter() {
      return new Vector((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2);
    }
    getArea() {
      return this.width * this.height;
    }
    overlaps(other) {
      if (other.type === ShapeType.Rectangle) {
        const otherRect = other;
        return this.min.x < otherRect.max.x && this.max.x > otherRect.min.x && this.min.y < otherRect.max.y && this.max.y > otherRect.min.y;
      } else if (other.type === ShapeType.Circle) {
        const circle = other;
        const closest = new Vector(clamp(circle.center.x, this.min.x, this.max.x), clamp(circle.center.y, this.min.y, this.max.y));
        const distSq = circle.center.distanceSquared(closest);
        return distSq < circle.radius * circle.radius + EPSILON_SQ;
      }
      return false;
    }
    getCorners() {
      return [
        new Vector(this.min.x, this.min.y),
        new Vector(this.max.x, this.min.y),
        new Vector(this.max.x, this.max.y),
        new Vector(this.min.x, this.max.y)
      ];
    }
  };
  __name(_Rectangle, "Rectangle");
  var Rectangle = _Rectangle;

  // src/managers/PhysicsManager.js
  window.initializePhysics = function() {
    if (window._Physick_world) return;
    const { World: World2 } = window.CollisionDetection;
    const gravity = Number(window._Physick_params.gravity || 980);
    window._Physick_world = new World2({
      gravity,
      timeStep: 1 / 60,
      spatialCellSize: 48
      // RMMZ tile size
    });
    console.log(`PhysicsManager: Initialized (gravity=${gravity})`);
  };
  window.updatePhysics = function() {
    if (window._Physick_world) {
      window._Physick_world.step(1 / 60);
    }
  };

  // src/scenes/Scene_Map.js
  var _Scene_Map_create = Scene_Map.prototype.create;
  Scene_Map.prototype.create = function() {
    _Scene_Map_create.call(this);
    window.initializePhysics();
  };
  var _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    window.updatePhysics();
  };

  // src/sprites/Sprite_Body.js
  window.Sprite_Body = class extends Sprite {
    initialize(body) {
      super.initialize();
      this._body = body;
      this.createBitmap();
    }
    createBitmap() {
      const { Circle: Circle2 } = window.CollisionDetection;
      if (this._body.shape instanceof Circle2) {
        const radius = this._body.shape.radius;
        this.bitmap = new Bitmap(radius * 2, radius * 2);
        this.bitmap.drawCircle(radius, radius, radius, "#ffffff");
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

  // src/index.js
  window.CollisionDetection = esm_exports;
  window._Physick_params = PluginManager.parameters("Physick");
  window._Physick_world = null;
  window.PhysicsWorld = () => window._Physick_world;
  console.log("Physick plugin loaded");
})();

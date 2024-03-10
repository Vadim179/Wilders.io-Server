import Matter from "matter-js";
import {
  itemToCollectRank,
  collectableSizeToOptions,
  map,
} from "@/config/mapConfig";
import { Position } from "@/types/mapTypes";

import { EntityCategories } from "@/enums/entityCategoriesEnum";
import { EntityTags } from "@/enums/entityTagsEnum";
import { Collectable } from "@/entities/Collectable";

/**
 * Used to enable physics in the game (collisions especially)
 */
class PhysicsEngine {
  engine: Matter.Engine;

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
    });

    this.loadCollectables();
    this.run();
  }

  /**
   * Get world
   *
   * @returns {Matter.World}
   */
  getWorld() {
    return this.engine.world;
  }

  /**
   * Get all bodies
   *
   * @returns {Matter.Body[]}
   */
  getBodies() {
    return this.engine.world.bodies;
  }

  /**
   * Load a matter-js body into the physics engine
   *
   * @param Matter.Body
   *
   * @returns {this}
   */
  loadBody(body: Matter.Body) {
    Matter.World.add(this.engine.world, body);
    return this;
  }

  /**
   * Load collectables from the map config into the physics engine
   *
   * @returns {this}
   */
  loadCollectables() {
    map.collectables.forEach((resource) => {
      const { id, radius, x, y, size, item } = resource;
      const { storageAmount, regenerationAmount } =
        collectableSizeToOptions[size];
      const collectRank = itemToCollectRank[item];

      const collectableOptions = {
        id,
        x,
        y,
        radius,
        item,
        storageAmount,
        regenerationAmount,
        collectRank,
      };

      const collectable = new Collectable(collectableOptions);
      this.loadBody(collectable.body);
    });

    return this;
  }

  /**
   * Load a player into the physics engine
   *
   * @param spawnPosition The initial position of the player
   *
   * @returns {Matter.Body}
   */
  loadPlayer({ x, y }: Position) {
    const airFriction = 0.25;
    const colliderRadius = 40;

    const playerCollisionGroup = Matter.Body.nextGroup(true);
    const body = Matter.Bodies.circle(x, y, colliderRadius, {
      label: EntityTags.Player,
      frictionAir: airFriction,
      friction: 0,
      collisionFilter: {
        group: playerCollisionGroup,
        category: EntityCategories.Player,
        mask: EntityCategories.All & ~EntityCategories.Player,
      },
    });

    this.loadBody(body);
    return body;
  }

  /**
   * Run the physics engine
   *
   * @returns {this}
   */
  run() {
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, this.engine);
    console.log("- Physics engine started.".cyan);
    return this;
  }
}

export const physicsEngine = new PhysicsEngine();

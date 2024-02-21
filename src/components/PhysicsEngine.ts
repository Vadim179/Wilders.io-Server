import Matter from "matter-js";
import { map } from "@/config/mapConfig";
import { Position } from "@/types/mapTypes";

import { EntityCategories } from "@/enums/entityCategoriesEnum";
import { EntityTags } from "@/enums/entityTagsEnum";

/**
 * Used to enable physics in the game (collisions especially)
 */
class PhysicsEngine {
  engine: Matter.Engine;

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
    });

    this.loadResources();
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
   * Load resources from the map config into the physics engine
   *
   * @returns {this}
   */
  loadResources() {
    map.resources.forEach((resource) => {
      const { radius, x, y } = resource;

      const body = Matter.Bodies.circle(x, y, radius, {
        label: EntityTags.Resource,
        isStatic: true,
        collisionFilter: { category: EntityCategories.Resource },
      });

      this.loadBody(body);
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

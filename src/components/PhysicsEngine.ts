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

class PhysicsEngine {
  engine: Matter.Engine;

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
    });

    this.loadCollectables();
    this.run();
  }

  getWorld() {
    return this.engine.world;
  }

  getBodies() {
    return this.engine.world.bodies;
  }

  loadBody(body: Matter.Body) {
    Matter.World.add(this.engine.world, body);
    return this;
  }

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

  run() {
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, this.engine);
    console.log("- Physics engine started.".cyan);
    return this;
  }
}

export const physicsEngine = new PhysicsEngine();

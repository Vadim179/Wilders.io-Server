import Matter from "matter-js";
import { IPosition } from "types";
import { GamePhysicsConfig, CoreConfig } from "../config";

type PhysicsEngineUpdateCallback = () => void;

export class PhysicsEngine {
  engine: Matter.Engine;

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: GamePhysicsConfig.gravity
    });
  }

  load(...bodies: Array<Matter.Body>) {
    bodies.forEach((body) => Matter.World.add(this.engine.world, body));
    return this;
  }

  loadPlayer({ x, y }: IPosition) {
    // TODO: Create radius config
    const body = Matter.Bodies.circle(x, y, 40, {
      frictionAir: GamePhysicsConfig.playerAirFriction,
      friction: 0
    });

    this.load(body);
    return body;
  }

  update(callback: PhysicsEngineUpdateCallback) {
    setInterval(callback, CoreConfig.tickRate);
    return this;
  }

  run() {
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, this.engine);
    return this;
  }
}

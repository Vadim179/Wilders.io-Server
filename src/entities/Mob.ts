import Matter from "matter-js";
import { Player } from "./Player";
import { physicsEngine } from "@/components/PhysicsEngine";
import { RegenerativeMobRegistryTag } from "@/enums/regenerativeMobRegistryTagEnum";

export interface MobOptions {
  id: number;
  x: number;
  y: number;
  radius: number;
  health: number;
  movementRadius: number;
  visionRadius: number;
  mobTag: RegenerativeMobRegistryTag;
}

export class Mob {
  id: number;
  health: number;
  movementRadius: number;
  visionRadius: number;
  mobTag: RegenerativeMobRegistryTag;

  targetX = 0;
  targetY = 0;

  timerTickRate = 2000;
  timer: NodeJS.Timeout;

  body: Matter.Body;
  target: Player | null = null;

  constructor(options: MobOptions) {
    const { id, x, y, radius, health, movementRadius, visionRadius, mobTag } =
      options;

    this.body = Matter.Bodies.circle(x, y, radius, { frictionAir: 0.1 });
    this.body.ownerClass = this;

    this.targetX = x;
    this.targetY = y;

    this.id = id;
    this.health = health;
    this.movementRadius = movementRadius;
    this.visionRadius = visionRadius;
    this.mobTag = mobTag;

    this.timer = setInterval(this.handleTick.bind(this), this.timerTickRate);
  }

  handleTick() {}

  handleGameTick() {}

  setTarget(target: Player | null) {
    this.target = target;
  }

  destroy() {
    clearInterval(this.timer);
    Matter.World.remove(physicsEngine.getWorld(), this.body);
  }
}

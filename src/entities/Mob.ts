import Matter from "matter-js";
import { Player } from "./Player";
import { physicsEngine } from "@/components/PhysicsEngine";
import { RegenerativeMobRegistryTag } from "@/enums/regenerativeMobRegistryTagEnum";
import { CustomWsServer } from "ws";

export interface MobOptions {
  id: number;
  x: number;
  y: number;
  bodyRadius: number;
  health: number;
  visionRadius: number;
  speed: number;
  mobTag: RegenerativeMobRegistryTag;
}

export class Mob {
  public id: number;
  public health: number;
  public visionRadius: number;
  public mobTag: RegenerativeMobRegistryTag;

  public targetX = 0;
  public targetY = 0;
  public speed = 0;
  public speedMultiplierOnTarget = 3;
  public randomWanderAngle = 0;

  private timerTickRate = 2000;
  private timer: NodeJS.Timeout;

  public body: Matter.Body;
  public target: Player | null = null;

  constructor(options: MobOptions) {
    this.initializeProperties(options);
    this.initializeBody(options);
    this.startTimer();
  }

  private initializeProperties(options: MobOptions): void {
    const { id, x, y, health, speed, visionRadius, mobTag } = options;

    this.id = id;
    this.targetX = x;
    this.targetY = y;
    this.speed = speed;
    this.health = health;
    this.visionRadius = visionRadius;
    this.mobTag = mobTag;
  }

  private initializeBody({ x, y, bodyRadius }: MobOptions) {
    this.body = Matter.Bodies.circle(x, y, bodyRadius, { frictionAir: 0.1 });
    this.body.ownerClass = this;
    physicsEngine.loadBody(this.body);
  }

  private startTimer() {
    this.timer = setInterval(() => this.handleTick(), this.timerTickRate);
  }

  protected handleTick() {}

  protected checkForTarget(ws: CustomWsServer) {
    const players = Array.from(ws.clients).map((socket) => socket.player);

    const closestPlayer = players.reduce((closest, player) => {
      const distance = Math.sqrt(
        (player.body.position.x - this.body.position.x) ** 2 +
          (player.body.position.y - this.body.position.y) ** 2,
      );

      if (distance < this.visionRadius) {
        return !closest || distance < closest.distance
          ? { player, distance }
          : closest;
      }

      return closest;
    }, null as { player: Player; distance: number } | null);

    this.target = closestPlayer ? closestPlayer.player : null;
  }

  public handleGameTick(ws: CustomWsServer) {
    this.checkForTarget(ws);
  }

  public setTarget(target: Player | null) {
    this.target = target;
  }

  public takeDamage(damage: number) {
    this.health -= damage;

    if (this.health <= 0) {
      this.destroy();
    }
  }

  public destroy() {
    clearInterval(this.timer);
    Matter.World.remove(physicsEngine.getWorld(), this.body);
  }
}

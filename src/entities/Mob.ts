import Matter from "matter-js";
import { Player } from "./Player";
import { physicsEngine } from "@/components/PhysicsEngine";
import { RegenerativeMobRegistryTag } from "@/enums/regenerativeMobRegistryTagEnum";
import { CustomWsServer } from "ws";
import { InventoryItemStack } from "@/config/craftingRecipes";

export interface MobOptions {
  id: number;
  x: number;
  y: number;
  bodyRadius: number;
  health: number;
  visionRadius: number;
  idleSpeed: number;
  actionSpeed: number;
  mobTag: RegenerativeMobRegistryTag;
  drops: InventoryItemStack[];
}

export class Mob {
  public id: number;
  public health: number;
  public visionRadius: number;
  public mobTag: RegenerativeMobRegistryTag;
  public drops: InventoryItemStack[];

  public targetX = 0;
  public targetY = 0;
  public idleSpeed = 0;
  public actionSpeed = 0;
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
    const {
      id,
      x,
      y,
      health,
      idleSpeed,
      actionSpeed,
      visionRadius,
      mobTag,
      drops,
    } = options;

    this.id = id;
    this.targetX = x;
    this.targetY = y;
    this.idleSpeed = idleSpeed;
    this.actionSpeed = actionSpeed;
    this.health = health;
    this.visionRadius = visionRadius;
    this.mobTag = mobTag;
    this.drops = drops;
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

  public takeDamage(damage: number, player: Player) {
    this.health -= damage;

    if (this.health <= 0) {
      player.inventory.addItems(this.drops);
      this.destroy();
    }
  }

  public destroy() {
    clearInterval(this.timer);
    Matter.World.remove(physicsEngine.getWorld(), this.body);
  }
}

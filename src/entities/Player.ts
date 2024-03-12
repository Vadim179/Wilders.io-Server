import Matter from "matter-js";
import { Socket } from "socket.io";

import { physicsEngine } from "@/components/PhysicsEngine";
import { Inventory } from "@/components/Inventory";

import { getRandomSpawnPosition } from "@/helpers/getRandomSpawnPosition";
import { Collectable } from "./Collectable";
import { CollectRank } from "@/enums/collectRankEnum";
import {
  itemCategoryMap,
  pickaxeCollectRankMap,
  foodRestoreMap,
} from "@/config/itemUseOptions";
import { ItemCategory } from "@/enums/itemCategoryEnum";
import { Item } from "@/enums/itemEnum";
import { EventEmitter } from "stream";
import { SocketEvent } from "@/enums/socketEvent";

enum Stat {
  Hunger,
  Temperature,
  Health,
}

export class Player extends EventEmitter {
  private dirX = 0;
  private dirY = 0;
  private angle = 0;

  private stats = {
    [Stat.Hunger]: 100,
    [Stat.Temperature]: 100,
    [Stat.Health]: 100,
  };

  helmet: Item | null = null;
  weaponOrTool: Item | null = null;

  id: string;
  username: string;
  body: Matter.Body;
  inventory = new Inventory();

  isAttacking = false;
  previousX = 0;
  previousY = 0;

  constructor(private readonly socket: Socket) {
    super();
    this.id = socket.id;
    this.username = socket.handshake.query.username as string;

    const spawnPosition = getRandomSpawnPosition();
    this.previousX = spawnPosition.x;
    this.previousY = spawnPosition.y;

    this.body = physicsEngine.loadPlayer(spawnPosition);
    this.body.ownerClass = this;

    socket.player = this;
    socket.emit(SocketEvent.Init, spawnPosition);
    console.log(`- Player [${this.username.underline}] joined.`.yellow);

    this.inventory.on("update", (items: Item[][]) => {
      const hasHelmet = items.some(([item]) => item === this.helmet);
      const hasWeaponOrTool = items.some(
        ([item]) => item === this.weaponOrTool,
      );

      if (!hasHelmet) this.setHelmet(null);
      if (!hasWeaponOrTool) this.setWeaponOrTool(null);

      socket.emit(SocketEvent.InventoryUpdate, items);
    });

    this.on("stats_update", (stats) => {
      socket.emit(SocketEvent.StatsUpdate, stats);
    });
  }

  get health() {
    return this.stats[Stat.Health];
  }

  get temperature() {
    return this.stats[Stat.Temperature];
  }

  get hunger() {
    return this.stats[Stat.Hunger];
  }

  get collectRank() {
    const category = this.weaponOrTool
      ? itemCategoryMap[this.weaponOrTool]
      : null;

    if (category === ItemCategory.Pickaxe && this.weaponOrTool) {
      return pickaxeCollectRankMap[this.weaponOrTool];
    }

    return CollectRank.R1;
  }

  /**
   * Handle cycles. Cycles happen every 5 seconds.
   *
   * @returns {this}
   */
  handleCycle() {
    this.drainStat(Stat.Hunger, 1.5, false);
    this.drainStat(Stat.Temperature, 2, false);

    // Add health in case the temperature and hunger are over 70%
    if ([this.temperature, this.hunger].every((stat) => stat >= 70)) {
      this.fillStat(Stat.Health, 10, false);
    }

    // Drain health in case temperature is 0%
    if (this.temperature === 0) {
      this.drainStat(Stat.Health, 10, false);
    }

    // Drain health in case hunger is 0%
    if (this.hunger === 0) {
      this.drainStat(Stat.Health, 20, false);
    }

    this.emit("stats_update", this.stats);
    return this;
  }

  /**
   * Destroy player (when dying or when disconnecting)
   *
   * @returns {this}
   */
  destroy() {
    Matter.World.remove(physicsEngine.getWorld(), this.body);
    return this;
  }

  /**
   * Set the helmet
   *
   * @param item
   *
   * @returns {this}
   */
  setHelmet(item: Item | null) {
    const helmet = this.helmet === item ? null : item;
    this.helmet = helmet;
    this.socket.emit(SocketEvent.HelmetUpdate, helmet);
    return this;
  }

  /**
   * Set weapon or tool
   *
   * @param item
   *
   * @returns {this}
   */
  setWeaponOrTool(item: Item | null) {
    const weaponOrTool = this.weaponOrTool === item ? null : item;
    this.weaponOrTool = weaponOrTool;
    this.socket.emit(SocketEvent.WeaponOrToolUpdate, weaponOrTool);
    return this;
  }

  /**
   * Set angle of rotation
   *
   * @param angle New angle
   *
   * @returns {this}
   */
  setAngle(angle: number) {
    this.angle = angle;
    Matter.Body.setAngle(this.body, angle);
    return this;
  }

  useItem(slotIndex: number) {
    const slots = this.inventory.getItems();
    const slot = slots[slotIndex];

    if (!slot || slot[0] === null) {
      console.error("Slot is empty");
      return;
    }

    const item = slot[0];
    const category = itemCategoryMap[item];

    switch (category) {
      case ItemCategory.Helmet:
        this.setHelmet(item);
        break;
      case ItemCategory.Weapon:
        this.setWeaponOrTool(item);
        break;
      case ItemCategory.Pickaxe:
        this.setWeaponOrTool(item);
        break;
      case ItemCategory.Food:
        const restoreAmount = foodRestoreMap[item];
        this.fillStat(Stat.Hunger, restoreAmount);
        break;
      default:
        console.error("Item not usable");
        return;
    }
  }

  /**
   * Set movement direction
   *
   * @param direction 0 for X, 1 for Y
   * @param value
   *
   * @returns {this}
   */
  setDirection(direction: number, value: number) {
    if (direction === 0) return (this.dirX = value), this;
    return (this.dirY = value), this;
  }

  /**
   * Calculates the new position based on the direction
   *
   * @returns {this}
   */
  calculatePosition() {
    const { dirX, dirY, body } = this;
    const speed = 14;

    let x = dirX * speed;
    let y = dirY * speed;

    if (dirX !== 0 && dirY !== 0) {
      x /= Math.sqrt(2);
      y /= Math.sqrt(2);
    }

    Matter.Body.setVelocity(body, { x, y });

    if (
      body.position.x === this.previousX &&
      body.position.y === this.previousY
    ) {
      return this;
    }

    const xBuffer = Buffer.alloc(8);
    const yBuffer = Buffer.alloc(8);

    xBuffer.writeDoubleLE(this.body.position.x);
    yBuffer.writeDoubleLE(this.body.position.y);

    const arrayBuffer = Buffer.concat([xBuffer, yBuffer]);
    this.socket.emit(SocketEvent.MovementUpdate, arrayBuffer);

    this.previousX = this.body.position.x;
    this.previousY = this.body.position.y;

    return this;
  }

  /**
   * Drain a stat (minim is 0)
   *
   * @param stat
   * @param value
   *
   * @returns {this}
   */
  drainStat(stat: Stat, value: number, emit = true) {
    this.stats[stat] = Math.max(0, this.stats[stat] - value);
    if (emit) this.emit("stats_update", { [stat]: this.stats[stat] });
    return this;
  }

  /**
   * Fill a stat (maximum is 100)
   *
   * @param stat
   * @param value
   *
   * @returns {this}
   */
  fillStat(stat: Stat, value: number, emit = true) {
    this.stats[stat] = Math.min(100, this.stats[stat] + value);
    if (emit) this.emit("stats_update", { [stat]: this.stats[stat] });
    return this;
  }

  /**
   * Calculates the entities within the collision range on attack
   *
   * @returns {void}
   */
  attack() {
    const angle = this.body.angle - (90 * Math.PI) / 180;

    const attackBodyDistance = 40;
    const attackBodyRadius = 40;

    const attackPosition = {
      x: this.body.position.x + Math.cos(angle) * attackBodyDistance,
      y: this.body.position.y + Math.sin(angle) * attackBodyDistance,
    };

    const colliderBounds = {
      min: {
        x: attackPosition.x - attackBodyRadius,
        y: attackPosition.y - attackBodyRadius,
      },
      max: {
        x: attackPosition.x + attackBodyRadius,
        y: attackPosition.y + attackBodyRadius,
      },
    };

    for (const body of physicsEngine.getBodies()) {
      if (body === this.body) continue;

      if (Matter.Bounds.overlaps(body.bounds, colliderBounds)) {
        if (body.ownerClass instanceof Collectable) {
          const bodyAttackDirection = {
            x: body.position.x - attackPosition.x,
            y: body.position.y - attackPosition.y,
          };

          const bodyAttackAngle = Math.atan2(
            bodyAttackDirection.y,
            bodyAttackDirection.x,
          );

          // TODO: Send to nearby players only
          // TODO: Send all collectables to the client together
          this.socket.emit(SocketEvent.AnimateCollectable, [
            body.ownerClass.id,
            bodyAttackAngle,
          ]);

          const { item, amount } = body.ownerClass.collect(this.collectRank);
          if (item !== null) this.inventory.addItem(item, amount);
        }
      }
    }

    this.socket.emit(SocketEvent.Attack);
    return this;
  }
}

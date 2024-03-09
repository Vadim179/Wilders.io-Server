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

enum Stat {
  Hunger = "hunger",
  Temperature = "temperature",
  Health = "health",
}

export class Player extends EventEmitter {
  private dirX = 0;
  private dirY = 0;
  private angle = 0;

  private health = 100;
  private temperature = 100;
  private hunger = 100;

  helmet: Item | null = null;
  weaponOrTool: Item | null = null;

  id: string;
  username: string;
  body: Matter.Body;
  inventory = new Inventory();

  constructor(private readonly socket: Socket) {
    super();
    this.id = socket.id;
    this.username = socket.handshake.query.username as string;

    const spawnPosition = getRandomSpawnPosition();
    this.body = physicsEngine.loadPlayer(spawnPosition);
    this.body.ownerClass = this;

    socket.player = this;
    socket.emit("init", spawnPosition);
    console.log(`- Player [${this.username.underline}] joined.`.yellow);

    this.inventory.on("update", (items) =>
      socket.emit("inventory_update", items),
    );

    this.on("stats_update", (stats) => {
      socket.emit("stats_update", stats);
    });
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

  get stats() {
    return {
      health: this.health,
      temperature: this.temperature,
      hunger: this.hunger,
    };
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
  setHelmet(item: Item) {
    const helmet = this.helmet === item ? null : item;
    this.helmet = helmet;
    this.socket.emit("helmet_update", helmet);
    return this;
  }

  /**
   * Set weapon or tool
   *
   * @param item
   *
   * @returns {this}
   */
  setWeaponOrTool(item: Item) {
    const weaponOrTool = this.weaponOrTool === item ? null : item;
    this.weaponOrTool = weaponOrTool;
    this.socket.emit("weapon_or_tool_update", weaponOrTool);
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
   * @param direction
   * @param value
   *
   * @returns {this}
   */
  setDirection(direction: "x" | "y", value: number) {
    if (direction === "x") return (this.dirX = value), this;
    return (this.dirY = value), this;
  }

  /**
   * Calculates the new position based on the direction
   *
   * @returns {this}
   */
  calculatePosition() {
    const { dirX, dirY, body } = this;
    const speed = 10;

    let x = dirX * speed;
    let y = dirY * speed;

    if (dirX !== 0 && dirY !== 0) {
      x /= Math.sqrt(2);
      y /= Math.sqrt(2);
    }

    Matter.Body.setVelocity(body, { x, y });
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
    this[stat] = Math.max(0, this[stat] - value);
    if (emit) this.emit("stats_update", { [stat]: this[stat] });
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
    this[stat] = Math.min(100, this[stat] + value);
    if (emit) this.emit("stats_update", { [stat]: this[stat] });
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
          const { item, amount } = body.ownerClass.collect(this.collectRank);
          if (item !== null) this.inventory.addItem(item, amount);
        }
      }
    }
  }

  /**
   * Returns the state available for all players
   */
  getPublicState() {
    return {
      id: this.id,
      x: this.body.position.x,
      y: this.body.position.y,
      username: this.username,
      angle: this.angle,
    };
  }
}

import Matter from "matter-js";
import { CustomWsServer, WebSocket } from "ws";

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
import { isPlayerNearby } from "@/helpers/isPlayerNearby";
import { sendBinaryDataToClient } from "@/helpers/sendBinaryDataToClient";
import { generatePlayerId } from "@/helpers/generatePlayerId";
import { broadcastEmitToNearbyPlayers } from "@/helpers/socketEmit";

enum Stat {
  Hunger = 0,
  Temperature = 1,
  Health = 2,
}

export class Player extends EventEmitter {
  private dirX = 0;
  private dirY = 0;

  angle = 0;
  previousAngle = 0;

  private stats = {
    [Stat.Hunger]: 100,
    [Stat.Temperature]: 100,
    [Stat.Health]: 100,
  };

  helmet: Item | null = null;
  weaponOrTool: Item | null = null;

  id: number;
  username: string;
  body: Matter.Body;
  inventory = new Inventory();
  nearbyPlayers: Player[] = [];

  isAttacking = false;
  previousX = 0;
  previousY = 0;

  constructor(
    public readonly socket: WebSocket,
    public readonly ws: CustomWsServer,
  ) {
    super();

    const id = generatePlayerId();
    this.id = id;
    this.socket.id = id;

    const [spawnX, spawnY, index] = getRandomSpawnPosition();
    this.previousX = spawnX;
    this.previousY = spawnY;

    this.body = physicsEngine.loadPlayer({ x: spawnX, y: spawnY });
    this.body.ownerClass = this;

    socket.player = this;

    // TODO: Move the map to a reusable function
    const otherPlayers = Array.from(this.ws.clients)
      .filter((socket) => socket.id !== this.id)
      .map(({ player }) => [
        player.id,
        player.username,
        Math.round(player.body.position.x),
        Math.round(player.body.position.y),
        player.angle,
      ]);

    sendBinaryDataToClient(socket, SocketEvent.Init, [index, id, otherPlayers]);

    this.inventory.on("update", (items: Item[][]) => {
      const hasHelmet = items.some(([item]) => item === this.helmet);
      const hasWeaponOrTool = items.some(
        ([item]) => item === this.weaponOrTool,
      );

      if (!hasHelmet) this.setHelmet(null);
      if (!hasWeaponOrTool) this.setWeaponOrTool(null);

      const changedSlots = this.inventory
        .getChangedSlots()
        .reduce<(number | null)[]>((acc, slot, index) => {
          acc.push(index, slot.item, slot.amount);
          return acc;
        }, []);

      if (changedSlots.length > 0) {
        sendBinaryDataToClient(
          socket,
          SocketEvent.InventoryUpdate,
          changedSlots,
        );
      }

      this.inventory.updatePreviousSlots();
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
    this.drainStat(Stat.Hunger, 1.5);
    this.drainStat(Stat.Temperature, 2);

    // Add health in case the temperature and hunger are over 70%
    if ([this.temperature, this.hunger].every((stat) => stat >= 70)) {
      this.fillStat(Stat.Health, 10);
    }

    // Drain health in case temperature is 0%
    if (this.temperature === 0) {
      this.drainStat(Stat.Health, 10);
    }

    // Drain health in case hunger is 0%
    if (this.hunger === 0) {
      this.drainStat(Stat.Health, 20);
    }

    return this;
  }

  /**
   * Destroy player (when dying or when disconnecting)
   *
   * @returns {this}
   */
  destroy() {
    Matter.World.remove(physicsEngine.getWorld(), this.body);
    broadcastEmitToNearbyPlayers(this, SocketEvent.PlayerRemove, this.id);
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
   * @param x X direction
   * @param y Y direction
   *
   * @returns {this}
   */
  setDirection(x: number, y: number) {
    this.dirX = x === 2 ? -1 : x;
    this.dirY = y === 2 ? -1 : y;
    return this;
  }

  /**
   * Calculates the new position based on the direction
   *
   * @returns {this}
   */
  // TODO: Send player movements in larger packets
  calculatePosition() {
    const { dirX, dirY, body } = this;
    const speed = 13;

    let x = dirX * speed;
    let y = dirY * speed;

    if (dirX !== 0 && dirY !== 0) {
      const invSqrt2 = 0.70710678118;
      x *= invSqrt2;
      y *= invSqrt2;
    }

    x = Math.round(x);
    y = Math.round(y);

    Matter.Body.setVelocity(body, { x, y });

    if (
      body.position.x !== this.previousX ||
      body.position.y !== this.previousY
    ) {
      this.previousX = this.body.position.x;
      this.previousY = this.body.position.y;
    }

    return this;
  }

  calculateNearbyPlayers() {
    const otherPlayers = Array.from(this.ws.clients);

    const currentNearbyPlayers = otherPlayers
      .filter(
        (socket) =>
          socket.player.id !== this.id && isPlayerNearby(this, socket.player),
      )
      .map((socket) => socket.player);

    this.nearbyPlayers = currentNearbyPlayers;
  }

  handleTick() {
    this.calculatePosition();
    this.calculateNearbyPlayers();
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
  drainStat(stat: Stat, value: number) {
    this.stats[stat] = Math.max(0, this.stats[stat] - value);
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
  fillStat(stat: Stat, value: number) {
    this.stats[stat] = Math.min(100, this.stats[stat] + value);
    return this;
  }

  /**
   * Calculates the entities within the collision range on attack
   *
   * @returns {void}
   */
  attack() {
    // this.angle is in degrees
    const angle = (this.angle * Math.PI) / 180 - Math.PI / 2;

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
        } else if (body.ownerClass instanceof Player) {
          // TODO: Add weapon damage
          body.ownerClass.drainStat(Stat.Health, 10);
        }
      }
    }

    sendBinaryDataToClient(this.socket, SocketEvent.Attack);
    broadcastEmitToNearbyPlayers(this, SocketEvent.AttackOther, this.id);
    return this;
  }
}

import Matter from "matter-js";
import {
  // CustomWsServer,
  WebSocket,
} from "ws";

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
// import { isPlayerNearby } from "@/helpers/isPlayerNearby";
import { sendBinaryDataToClient } from "@/helpers/sendBinaryDataToClient";

enum Stat {
  Hunger = 0,
  Temperature = 1,
  Health = 2,
}

export class Player extends EventEmitter {
  private dirX = 0;
  private dirY = 0;
  // @ts-ignore
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
  nearbyPlayers: Player[] = [];

  isAttacking = false;
  previousX = 0;
  previousY = 0;

  constructor(
    private readonly socket: WebSocket, // private readonly ws: CustomWsServer,
  ) {
    super();
    // this.id = socket.id;
    // this.username = socket.handshake.query.username as string;
    this.username = "";
    this.id = "";

    const [spawnX, spawnY, index] = getRandomSpawnPosition();
    this.previousX = spawnX;
    this.previousY = spawnY;

    this.body = physicsEngine.loadPlayer({ x: spawnX, y: spawnY });
    this.body.ownerClass = this;

    socket.player = this;
    sendBinaryDataToClient(socket, SocketEvent.Init, index);
    console.log(`- Player [${this.username.underline}] joined.`.yellow);

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
    });

    this.on("stats_update", (stats) => {
      const statsPayload = [
        stats[Stat.Health],
        stats[Stat.Temperature],
        stats[Stat.Hunger],
      ].map(Math.floor);

      sendBinaryDataToClient(
        this.socket,
        SocketEvent.StatsUpdate,
        statsPayload,
      );
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
    // this.broadcastWithId(SocketEvent.PlayerRemove);
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
    sendBinaryDataToClient(this.socket, SocketEvent.HelmetUpdate, helmet);
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
    sendBinaryDataToClient(
      this.socket,
      SocketEvent.WeaponOrToolUpdate,
      weaponOrTool,
    );
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
    // this.broadcastWithId(SocketEvent.RotateOther, angle);
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
  calculatePosition() {
    const { dirX, dirY, body } = this;
    const speed = 14;

    let x = dirX * speed;
    let y = dirY * speed;

    if (dirX !== 0 && dirY !== 0) {
      const invSqrt2 = 0.70710678118;
      x *= invSqrt2;
      y *= invSqrt2;
    }

    Matter.Body.setVelocity(body, { x, y });

    if (
      body.position.x !== this.previousX ||
      body.position.y !== this.previousY
    ) {
      const position = [
        Math.round(body.position.x),
        Math.round(body.position.y),
      ];

      sendBinaryDataToClient(this.socket, SocketEvent.MovementUpdate, position);
      this.previousX = this.body.position.x;
      this.previousY = this.body.position.y;
    }

    return this;
  }

  // calculateNearbyPlayers() {
  //   const otherPlayers = getSockets(this.io);

  //   const currentNearbyPlayers = otherPlayers
  //     .filter(
  //       (socket) =>
  //         socket.player.id !== this.id && isPlayerNearby(this, socket.player),
  //     )
  //     .map((socket) => socket.player);

  //   const newNearbyPlayers = currentNearbyPlayers.filter(
  //     (player) => !this.nearbyPlayers.includes(player),
  //   );

  //   const removedNearbyPlayers = this.nearbyPlayers.filter(
  //     (player) => !currentNearbyPlayers.includes(player),
  //   );

  //   newNearbyPlayers.forEach((player) => {
  //     this.socket.emit(SocketEvent.PlayerInitialization, [
  //       player.id,
  //       player.username,
  //       player.body.position.x,
  //       player.body.position.y,
  //       player.angle,
  //     ]);
  //   });

  //   removedNearbyPlayers.forEach((player) => {
  //     this.socket.emit(SocketEvent.PlayerRemove, player.id);
  //   });

  //   this.nearbyPlayers = currentNearbyPlayers;
  // }

  handleTick() {
    this.calculatePosition();
    // this.calculateNearbyPlayers();
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
          const { item, amount } = body.ownerClass.collect(this.collectRank);
          if (item !== null) this.inventory.addItem(item, amount);
        } else if (body.ownerClass instanceof Player) {
          // TODO: Add weapon damage
          body.ownerClass.drainStat(Stat.Health, 10);
        }
      }
    }

    sendBinaryDataToClient(this.socket, SocketEvent.Attack);
    return this;
  }
}

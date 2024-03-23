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
  weaponDamageMap,
  helmetResistanceMap,
  WeaponDamageMap,
  toolRangeAndRadiusMap,
  playerSpeedWithEquippedToolMap,
} from "@/config/itemUseOptions";
import { ItemCategory } from "@/enums/itemCategoryEnum";
import { Item } from "@/enums/itemEnum";
import { EventEmitter } from "stream";
import { ServerSocketEvent } from "@/enums/socketEvent";
import { isEntityNearby } from "@/helpers/isEntityNearby";
import { sendBinaryDataToClient } from "@/helpers/sendBinaryDataToClient";
import { generateEntityId, releaseEntityId } from "@/helpers/generateEntityId";
import {
  broadcastEmit,
  broadcastEmitToNearbyPlayers,
} from "@/helpers/socketEmit";
import { Stat } from "@/enums/statEnum";
import { Mob } from "./Mob";
import { regenerativeMobRegistry } from "@/components/RegenerativeMobRegistry";

const playerHandAttackDamage: WeaponDamageMap = {
  againstEntity: 5,
  againstBuildings: 5,
};

const playerInitialStats = {
  [Stat.Hunger]: 100,
  [Stat.Temperature]: 100,
  [Stat.Health]: 200,
};

export class Player extends EventEmitter {
  private dirX = 0;
  private dirY = 0;

  angle = 0;
  previousAngle = 0;

  private stats = { ...playerInitialStats };

  helmet: Item | null = null;
  weaponOrTool: Item | null = null;

  id: number;
  username: string;
  body: Matter.Body;
  inventory = new Inventory();

  nearbyPlayers: Player[] = [];
  nearbyMobs: Mob[] = [];

  isAttacking = false;
  previousX = 0;
  previousY = 0;

  constructor(
    public readonly socket: WebSocket,
    public readonly ws: CustomWsServer,
  ) {
    super();

    const id = generateEntityId("player");
    this.id = id;
    this.socket.id = id;

    const [spawnX, spawnY, index] = getRandomSpawnPosition();
    this.previousX = spawnX;
    this.previousY = spawnY;

    this.body = physicsEngine.loadPlayer({ x: spawnX, y: spawnY });
    this.body.ownerClass = this;

    socket.player = this;

    // Emit player initialization
    const otherPlayers = Array.from(this.ws.clients)
      .filter((socket) => socket.id !== this.id)
      .map(({ player }) => [
        player.id,
        player.username,
        Math.round(player.body.position.x),
        Math.round(player.body.position.y),
        player.angle,
        player.weaponOrTool,
        player.helmet,
        Math.round(player.health),
        Math.round(player.temperature),
        Math.round(player.hunger),
      ]);

    const mobs = regenerativeMobRegistry
      .getAllMobs()
      .map((mob) => [
        mob.mobTag,
        mob.id,
        mob.body.position.x,
        mob.body.position.y,
        mob.targetX,
        mob.targetY,
        mob.health,
      ]);

    sendBinaryDataToClient(socket, ServerSocketEvent.GameInit, [
      index,
      id,
      otherPlayers,
      mobs,
    ]);

    this.inventory.on("update", (items: Item[][]) => {
      const hasHelmet = items.some(([item]) => item === this.helmet);
      const hasWeaponOrTool = items.some(
        ([item]) => item === this.weaponOrTool,
      );

      if (!hasHelmet) this.setHelmet(null);
      if (!hasWeaponOrTool) this.setWeaponOrTool(null);

      const changedSlots = this.inventory
        .getChangedSlots()
        .reduce<(number | null)[]>((acc, slot) => {
          acc.push(slot.index, slot.item, slot.amount);
          return acc;
        }, []);

      console.log("slots", changedSlots);

      if (changedSlots.length > 0) {
        sendBinaryDataToClient(
          socket,
          ServerSocketEvent.InventoryUpdate,
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

  destroy() {
    Matter.World.remove(physicsEngine.getWorld(), this.body);
    broadcastEmit(this.id, this.ws, ServerSocketEvent.PlayerRemove, this.id);
    releaseEntityId("player", this.id);
    return this;
  }

  setHelmet(item: Item | null) {
    const helmet = this.helmet === item ? null : item;
    this.helmet = helmet;
    return this;
  }

  setWeaponOrTool(item: Item | null) {
    const weaponOrTool = this.weaponOrTool === item ? null : item;
    this.weaponOrTool = weaponOrTool;
    return this;
  }

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
        this.inventory.removeItem(item, 1);

        break;
      default:
        console.error("Item not usable");
        return;
    }
  }

  setDirection(x: number, y: number) {
    this.dirX = x === 2 ? -1 : x;
    this.dirY = y === 2 ? -1 : y;
    return this;
  }

  calculatePosition() {
    const { dirX, dirY, body } = this;
    const speed = this.weaponOrTool
      ? playerSpeedWithEquippedToolMap[this.weaponOrTool]
      : 12;

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
          socket.player.id !== this.id &&
          isEntityNearby(this.body, socket.player.body),
      )
      .map((socket) => socket.player);

    this.nearbyPlayers = currentNearbyPlayers;
  }

  calculateNearbyMobs() {
    const mobs = regenerativeMobRegistry.getAllMobs();

    const currentNearbyMobs = mobs.filter((mob) =>
      isEntityNearby(this.body, mob.body),
    );

    this.nearbyMobs = currentNearbyMobs;
  }

  handleTick() {
    this.calculatePosition();
    this.calculateNearbyPlayers();
    return this;
  }

  drainStat(stat: Stat, value: number) {
    this.stats[stat] = Math.max(0, this.stats[stat] - value);
    return this;
  }

  fillStat(stat: Stat, value: number) {
    this.stats[stat] = Math.min(
      playerInitialStats[stat],
      this.stats[stat] + value,
    );
    return this;
  }

  attack() {
    const angle = (this.angle * Math.PI) / 180 - Math.PI / 2;

    const attackBodyDistance = this.weaponOrTool
      ? toolRangeAndRadiusMap[this.weaponOrTool].toolRange
      : 40;
    const attackBodyRadius = this.weaponOrTool
      ? toolRangeAndRadiusMap[this.weaponOrTool].toolRadius
      : 40;

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

    const damageMap =
      this.weaponOrTool === null
        ? playerHandAttackDamage
        : weaponDamageMap[this.weaponOrTool];

    for (const body of physicsEngine.getBodies()) {
      if (body === this.body) continue;

      if (Matter.Bounds.overlaps(body.bounds, colliderBounds)) {
        if (body.ownerClass instanceof Collectable) {
          const { item, amount } = body.ownerClass.collect(this.collectRank);
          if (item !== null) this.inventory.addItem(item, amount);
        } else if (body.ownerClass instanceof Player) {
          const otherPlayerHelmetResistance =
            body.ownerClass.helmet === null
              ? 0
              : helmetResistanceMap[body.ownerClass.helmet].fromPlayer;

          body.ownerClass.drainStat(
            Stat.Health,
            Math.max(0, damageMap.againstEntity - otherPlayerHelmetResistance),
          );
        } else if (body.ownerClass instanceof Mob) {
          body.ownerClass.takeDamage(damageMap.againstEntity, this);
        }
      }
    }

    sendBinaryDataToClient(this.socket, ServerSocketEvent.Attack);
    broadcastEmitToNearbyPlayers(this, ServerSocketEvent.AttackOther, this.id);
    return this;
  }
}

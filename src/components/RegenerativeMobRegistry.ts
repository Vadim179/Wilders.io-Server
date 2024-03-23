import { map } from "@/config/mapConfig";
import { AggressiveMob } from "@/entities/AggressiveMob";
import { Mob } from "@/entities/Mob";
import { Item } from "@/enums/itemEnum";
import { RegenerativeMobRegistryTag } from "@/enums/regenerativeMobRegistryTagEnum";
import { ServerSocketEvent } from "@/enums/socketEvent";
import { generateEntityId } from "@/helpers/generateEntityId";
import { emitToAll } from "@/helpers/socketEmit";
import { CustomWsServer } from "ws";

class RegenerativeMobRegistry {
  private ws: CustomWsServer;
  private mobs = new Map<RegenerativeMobRegistryTag, Mob[]>();
  private mobRegenerationTimers = new Map<
    RegenerativeMobRegistryTag,
    NodeJS.Timeout
  >();

  initialize(ws: CustomWsServer) {
    this.ws = ws;

    // Register wolves
    this.registerMob(RegenerativeMobRegistryTag.Wolf, 1, 5000, true, () => {
      const id = generateEntityId("wolf");

      const randomSpawnIndex = Math.floor(
        Math.random() * map.mobSpawners.length,
      );
      const { x, y } = map.mobSpawners[randomSpawnIndex];

      return new AggressiveMob({
        id,
        x,
        y,
        bodyRadius: 75,
        health: 300,
        visionRadius: 350,
        idleSpeed: 2,
        actionSpeed: 6,
        damage: 48,
        attackRadius: 50,
        mobTag: RegenerativeMobRegistryTag.Wolf,
        drops: [
          { item: Item.WolfFur, quantity: 1 },
          { item: Item.RawMeat, quantity: 2 },
        ],
      });
    });

    return this;
  }

  registerMob(
    mobTag: RegenerativeMobRegistryTag,
    mobLimit: number,
    regenerateTime: number,
    loadInitialMobs: boolean,
    onRegenerate: () => Mob,
  ) {
    this.mobs.set(
      mobTag,
      loadInitialMobs ? Array.from({ length: mobLimit }, onRegenerate) : [],
    );

    const timer = setInterval(() => {
      const mobs = this.mobs.get(mobTag)!;

      if (mobs.length < mobLimit) {
        const newMob = onRegenerate();
        mobs.push(newMob);

        emitToAll(this.ws, ServerSocketEvent.MobInitialization, [
          newMob.mobTag,
          newMob.id,
          Math.floor(newMob.body.position.x),
          Math.floor(newMob.body.position.y),
        ]);
      }
    }, regenerateTime);

    this.mobRegenerationTimers.set(mobTag, timer);
    return this;
  }

  getsMobsOfTag(mobTag: RegenerativeMobRegistryTag) {
    return this.mobs.get(mobTag)!;
  }

  getAllMobs() {
    return Array.from(this.mobs.values()).flat();
  }

  removeMob(mobTag: RegenerativeMobRegistryTag, id: number) {
    const mobs = this.mobs.get(mobTag)!;
    const index = mobs.findIndex((mob) => mob.id === id);

    if (index !== -1) {
      mobs.splice(index, 1);
      emitToAll(this.ws, ServerSocketEvent.MobRemove, [mobTag, id]);
    }
  }
}

export const regenerativeMobRegistry = new RegenerativeMobRegistry();

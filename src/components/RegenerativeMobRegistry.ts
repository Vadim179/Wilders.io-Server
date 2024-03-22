import { map } from "@/config/mapConfig";
import { AggressiveMob } from "@/entities/AggressiveMob";
import { Mob } from "@/entities/Mob";
import { RegenerativeMobRegistryTag } from "@/enums/regenerativeMobRegistryTagEnum";
import { generateEntityId } from "@/helpers/generateEntityId";

class RegenerativeMobRegistry {
  private mobs = new Map<RegenerativeMobRegistryTag, Mob[]>();
  private mobRegenerationTimers = new Map<
    RegenerativeMobRegistryTag,
    NodeJS.Timeout
  >();

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
        mobs.push(onRegenerate());
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
    }
  }
}

export const regenerativeMobRegistry =
  new RegenerativeMobRegistry().registerMob(
    RegenerativeMobRegistryTag.Wolf,
    1,
    5000,
    true,
    () => {
      const id = generateEntityId("wolf");

      const randomSpawnIndex = Math.floor(
        Math.random() * map.mobSpawners.length,
      );
      const { x, y } = map.mobSpawners[randomSpawnIndex];

      return new AggressiveMob({
        id,
        x,
        y,
        bodyRadius: 40,
        health: 50,
        visionRadius: 400,
        speed: 2,
        damage: 10,
        attackRadius: 100,
        mobTag: RegenerativeMobRegistryTag.Wolf,
      });
    },
  );

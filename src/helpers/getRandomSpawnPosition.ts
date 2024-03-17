import { map } from "@/config/mapConfig";

export function getRandomSpawnPosition(): number[] {
  const randomSpawnPosition = (Math.random() * map.spawners.length) | 0;
  const spawner = map.spawners[randomSpawnPosition];
  return [spawner.x, spawner.y, randomSpawnPosition];
}

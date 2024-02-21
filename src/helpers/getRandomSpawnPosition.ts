import { map } from "../config/mapConfig";
import { Position } from "../types/mapTypes";

export function getRandomSpawnPosition(): Position {
  const randomSpawnPosition = Math.floor(Math.random() * map.spawners.length);
  return map.spawners[randomSpawnPosition];
}

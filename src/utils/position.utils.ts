import { Spawners } from "../config";
import { IPosition } from "types";

export function getRandomSpawnPosition(): IPosition {
  const randomSpawnPosition = Math.floor(Math.random() * Spawners.length);
  return Spawners[randomSpawnPosition];
}

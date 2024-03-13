import { Player } from "@/entities/Player";

export function isPlayerNearby(playerOne: Player, playerTwo: Player) {
  const distanceThreshold = 1000;

  const dx = playerOne.body.position.x - playerTwo.body.position.x;
  const dy = playerOne.body.position.y - playerTwo.body.position.y;

  return Math.sqrt(dx * dx + dy * dy) < distanceThreshold;
}

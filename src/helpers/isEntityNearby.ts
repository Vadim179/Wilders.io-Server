import Matter from "matter-js";

export function isEntityNearby(bodyOne: Matter.Body, bodyTwo: Matter.Body) {
  const distanceThreshold = 1000;

  const dx = bodyOne.position.x - bodyTwo.position.x;
  const dy = bodyOne.position.y - bodyTwo.position.y;

  return Math.sqrt(dx * dx + dy * dy) < distanceThreshold;
}

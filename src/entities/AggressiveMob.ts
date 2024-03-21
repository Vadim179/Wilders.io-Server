import { Stat } from "@/enums/statEnum";
import { Mob, MobOptions } from "./Mob";
import { lerp } from "@/helpers/lerp";
import { regenerativeMobRegistry } from "@/components/RegenerativeMobRegistry";
import { RegenerativeMobRegistryTag } from "@/enums/regenerativeMobRegistryTagEnum";

interface AggressiveMobOptions extends MobOptions {
  damage: number;
  attackRadius: number;
}

export class AggressiveMob extends Mob {
  damage: number;
  attackRadius: number;

  constructor({ damage, attackRadius, ...baseOptions }: AggressiveMobOptions) {
    super(baseOptions);

    this.damage = damage;
    this.attackRadius = attackRadius;
  }

  override handleTick() {
    const { x: mobX, y: mobY } = this.body.position;

    if (this.target) {
      const { x: targetX, y: targetY } = this.target.body.position;

      let directionX = targetX - mobX;
      let directionY = targetY - mobY;

      const distance = Math.sqrt(
        Math.pow(directionX, 2) + Math.pow(directionY, 2),
      );

      if (distance < this.attackRadius) {
        this.target.drainStat(Stat.Health, this.damage);
      }

      directionX /= distance;
      directionY /= distance;

      this.targetX =
        mobX + directionX * Math.min(distance, this.movementRadius);
      this.targetY =
        mobY + directionY * Math.min(distance, this.movementRadius);
    } else {
      const randomX =
        Math.random() * this.movementRadius * 2 - this.movementRadius;
      const randomY =
        Math.random() * this.movementRadius * 2 - this.movementRadius;

      this.targetX = mobX + randomX;
      this.targetY = mobY + randomY;
    }
  }

  override handleGameTick() {
    const lerpFactor = 0.05;
    this.body.position.x = lerp(this.body.position.x, this.targetX, lerpFactor);
    this.body.position.y = lerp(this.body.position.y, this.targetY, lerpFactor);
  }

  override destroy() {
    super.destroy();
    regenerativeMobRegistry.removeMob(RegenerativeMobRegistryTag.Wolf, this.id);
  }
}

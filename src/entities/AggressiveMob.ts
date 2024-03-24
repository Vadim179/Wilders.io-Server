import { Stat } from "@/enums/statEnum";
import { Mob, MobOptions } from "./Mob";
import { regenerativeMobRegistry } from "@/components/RegenerativeMobRegistry";
import { RegenerativeMobRegistryTag } from "@/enums/regenerativeMobRegistryTagEnum";
import Matter from "matter-js";
import { CustomWsServer } from "ws";

interface AggressiveMobOptions extends MobOptions {
  damage: number;
  attackRadius: number;
}

export class AggressiveMob extends Mob {
  private damage: number;
  private attackRadius: number;
  private lastAttackTime = 0;
  private attackCooldown = 1500;

  constructor({ damage, attackRadius, ...baseOptions }: AggressiveMobOptions) {
    super(baseOptions);
    this.damage = damage;
    this.attackRadius = attackRadius;
  }

  private moveTowards(targetX: number, targetY: number) {
    const { x: mobX, y: mobY } = this.body.position;
    let directionX = targetX - mobX;
    let directionY = targetY - mobY;
    const distance = Math.sqrt(directionX ** 2 + directionY ** 2);

    const thresholdDistance = 50;

    if (distance > thresholdDistance) {
      directionX /= distance;
      directionY /= distance;

      const speed = this.actionSpeed;
      const velocity = { x: directionX * speed, y: directionY * speed };
      Matter.Body.setVelocity(this.body, velocity);
    } else {
      Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
    }
  }

  private attackIfInRange(ws: CustomWsServer) {
    ws.clients.forEach((socket) => {
      const { x: targetX, y: targetY } = socket.player.body.position;

      const distance = Math.sqrt(
        (this.body.position.x - targetX) ** 2 +
          (this.body.position.y - targetY) ** 2,
      );

      if (distance < this.attackRadius) {
        socket.player.drainStat(Stat.Health, this.damage);
      }
    });
  }

  override handleTick() {
    this.randomWanderAngle = Math.random() * Math.PI * 2;
  }

  private wanderRandomly() {
    const velocity = {
      x: Math.cos(this.randomWanderAngle) * this.idleSpeed,
      y: Math.sin(this.randomWanderAngle) * this.idleSpeed,
    };

    Matter.Body.setVelocity(this.body, velocity);
  }

  override handleGameTick(ws: CustomWsServer) {
    super.handleGameTick(ws);

    const now = Date.now();
    if (now - this.lastAttackTime >= this.attackCooldown) {
      this.lastAttackTime = now;
      this.attackIfInRange(ws);
    }

    if (this.target) {
      this.moveTowards(
        this.target.body.position.x,
        this.target.body.position.y,
      );
    } else {
      this.wanderRandomly();
    }
  }

  override destroy() {
    super.destroy();
    regenerativeMobRegistry.removeMob(RegenerativeMobRegistryTag.Wolf, this.id);
  }
}

import Matter from "matter-js";
import { Socket } from "socket.io";

import { physicsEngine } from "@/components/PhysicsEngine";
import { getRandomSpawnPosition } from "@/helpers/getRandomSpawnPosition";

enum Stat {
  Hunger = "hunger",
  Temperature = "temperature",
  Health = "health",
}

export class Player {
  private dirX = 0;
  private dirY = 0;
  private angle = 0;

  private health = 100;
  private temperature = 100;
  private hunger = 100;

  id: string;
  username: string;
  body: Matter.Body;

  constructor(private readonly socket: Socket) {
    this.id = socket.id;
    this.username = socket.handshake.query.username as string;

    const spawnPosition = getRandomSpawnPosition();
    this.body = physicsEngine.loadPlayer(spawnPosition);
    this.body.ownerClass = this;

    socket.player = this;
    socket.emit("spawn", spawnPosition);
    console.log(`- Player [${this.username.underline}] joined.`.yellow);
  }

  /**
   * Handle cycles. Cycles happen every 5 seconds.
   *
   * @returns {this}
   */
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

    this.socket.emit("tick", { stats: this.getPrivateState() });
    return this;
  }

  /**
   * Destroy player (when dying or when disconnecting)
   *
   * @returns {this}
   */
  destroy() {
    Matter.World.remove(physicsEngine.getWorld(), this.body);
    return this;
  }

  /**
   * Set angle of rotation
   *
   * @param angle New angle
   *
   * @returns {this}
   */
  setAngle(angle: number) {
    this.angle = angle;
    Matter.Body.setAngle(this.body, angle);
    return this;
  }

  /**
   * Set movement direction
   *
   * @param direction
   * @param value
   *
   * @returns {this}
   */
  setDirection(direction: "x" | "y", value: number) {
    if (direction === "x") return (this.dirX = value), this;
    return (this.dirY = value), this;
  }

  /**
   * Calculates the new position based on the direction
   *
   * @returns {this}
   */
  calculatePosition() {
    const { dirX, dirY, body } = this;
    const speed = 8;

    let x = dirX * speed;
    let y = dirY * speed;

    if (dirX !== 0 && dirY !== 0) {
      x /= Math.sqrt(2);
      y /= Math.sqrt(2);
    }

    Matter.Body.setVelocity(body, { x, y });
    return this;
  }

  /**
   * Drain a stat (minim is 0)
   *
   * @param stat
   * @param value
   *
   * @returns {this}
   */
  drainStat(stat: Stat, value: number) {
    this[stat] = Math.max(0, this[stat] - value);
    return this;
  }

  /**
   * Fill a stat (maximum is 100)
   *
   * @param stat
   * @param value
   *
   * @returns {this}
   */
  fillStat(stat: Stat, value: number) {
    this[stat] = Math.min(100, this[stat] + value);
    return this;
  }

  /**
   * Calculates the entities within the collision range on attack
   *
   * @returns {void}
   */
  attack() {
    const angle = this.body.angle - (90 * Math.PI) / 180;

    const attackBodyDistance = 40;
    const attackBodyRadius = 40;

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

    for (const body of physicsEngine.getBodies()) {
      if (body === this.body) continue;

      if (Matter.Bounds.overlaps(body.bounds, colliderBounds)) {
        console.log("Player collider collided with:", body.label);
      }
    }
  }

  /**
   * Returns the state available only for the player himself
   */
  getPrivateState() {
    return {
      health: this.health,
      temperature: this.temperature,
      hunger: this.hunger,
    };
  }

  /**
   * Returns the state available for all players
   */
  getPublicState() {
    return {
      id: this.id,
      x: this.body.position.x,
      y: this.body.position.y,
      username: this.username,
      angle: this.angle,
    };
  }
}

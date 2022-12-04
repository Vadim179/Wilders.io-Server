import Matter from "matter-js";

interface IPlayerConstructorParams {
  id: string;
  username: string;
  body: Matter.Body;
}

type PlayerStat = "health" | "temperature" | "hunger";

export class Player {
  speed = 8;

  x = 0;
  y = 0;
  rotation = 0;

  health = 100;
  temperature = 100;
  hunger = 100;

  id: string;
  username: string;
  body: Matter.Body;

  constructor({ id, username, body }: IPlayerConstructorParams) {
    this.id = id;
    this.username = username;
    this.body = body;
  }

  // This method is called when the player is created
  public start() {
    return this;
  }

  // This method is called every tick
  public update() {
    this.move();

    return this;
  }

  // This method is called when the player disconnects
  public destroy(world: Matter.World) {
    Matter.World.remove(world, this.body);
  }

  private move() {
    const { x, y, speed, body } = this;

    let _x = x * speed;
    let _y = y * speed;

    if (x !== 0 && y !== 0) {
      _x /= Math.sqrt(2);
      _y /= Math.sqrt(2);
    }

    Matter.Body.setVelocity(body, { x: _x, y: _y });
  }

  // Drains one of the player's stats, minimum value is 0
  public drainStat(stat: PlayerStat, amount: number) {
    this[stat] = Math.max(0, this[stat] - amount);

    return this;
  }

  // Fills one of the player's stats, maximum value is 100
  public fillStat(stat: PlayerStat, amount: number) {
    this[stat] = Math.min(100, this[stat] + amount);

    return this;
  }

  // Returns data that is only visible to the player
  public getPrivateState() {
    return {
      health: this.health,
      temperature: this.temperature,
      hunger: this.hunger
    };
  }

  // Returns data that is visible to all players
  public getPublicState() {
    return {
      id: this.id,
      x: this.body.position.x,
      y: this.body.position.y,
      username: this.username,
      rotation: this.rotation
    };
  }
}

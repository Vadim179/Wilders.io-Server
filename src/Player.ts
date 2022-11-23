import Matter from "matter-js";

interface IPlayerConstructorParams {
  id: string;
  username: string;
  body: Matter.Body;
}

export class Player {
  speed = 8;

  x = 0;
  y = 0;
  rotation = 0;

  attacking = false;
  lastAttack = 0;

  id: string;
  username: string;
  body: Matter.Body;

  constructor({ id, username, body }: IPlayerConstructorParams) {
    this.id = id;
    this.username = username;
    this.body = body;
  }

  move() {
    const { x, y, speed, body } = this;

    let _x = x * speed;
    let _y = y * speed;

    if (x !== 0 && y !== 0) {
      _x /= Math.sqrt(2);
      _y /= Math.sqrt(2);
    }

    Matter.Body.setVelocity(body, { x: _x, y: _y });
  }

  update() {
    this.move();
  }

  getClientData() {
    const { id, rotation, username } = this;

    return {
      id: id,
      u: username,
      r: rotation,
      x: this.body.position.x,
      y: this.body.position.y
    };
  }
}

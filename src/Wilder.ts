import Matter from "matter-js"
import { GamePhysicsConfig } from "./config"
import { IWilder } from "types"

interface IWilderConstructorParams {
  id: string
  username: string
  body: Matter.Body
}

export class Wilder implements IWilder {
  speed = GamePhysicsConfig.wilderSpeed

  x = 0
  y = 0
  r = 0

  id: string
  username: string
  body: Matter.Body

  constructor({ id, username, body }: IWilderConstructorParams) {
    this.id = id
    this.username = username
    this.body = body
  }

  getClientData() {
    const { id, r, username } = this

    return {
      id: id,
      u: username,
      x: Math.floor(this.body.position.x),
      y: Math.floor(this.body.position.y),
      r,
    }
  }
}

import Matter from "matter-js"
import { Socket } from "socket.io"

export interface IPosition {
  x: number
  y: number
}

interface IWilderClientData extends IPosition {
  id: string
  u: string
  r: number
}

export interface IWilder extends IPosition {
  id: string
  username: string

  r: number
  body: Matter.Body

  getClientData(): IWilderClientData
}

export interface ISocket extends Socket {
  wilder: IWilder
}

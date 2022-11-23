import { Socket } from "socket.io";
import { Player } from "Player";

export interface IPosition {
  x: number;
  y: number;
}

export interface IExtendedSocket extends Socket {
  player: Player;
}

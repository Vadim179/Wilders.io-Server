import { Socket } from "socket.io";
import { Player } from "../entities/Player";

export interface IExtendedSocket extends Socket {
  player: Player;
}

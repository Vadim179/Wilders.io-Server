import { Socket } from "socket.io";
import { Player } from "../entities/player.entity";

export interface IExtendedSocket extends Socket {
  player: Player;
}

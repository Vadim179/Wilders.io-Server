import { Player } from "@/entities/Player";

declare module "socket.io" {
  interface Socket {
    player: Player;
  }
}

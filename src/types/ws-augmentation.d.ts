import { Player } from "@/entities/Player";

declare module "ws" {
  interface CustomMessageEvent {
    data: ArrayBuffer;
  }

  interface WebSocket {
    player: Player;
    onmessage: (message: CustomMessageEvent) => void;
  }

  export class CustomWsServer extends Server {
    clients: Set<WebSocket>;
  }
}

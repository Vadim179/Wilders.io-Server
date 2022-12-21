import { Server } from "socket.io";
import { getSockets } from "../utils";

export class Ticker {
  constructor(private readonly io: Server) {}

  public start(): void {
    const time = 5000;

    // TODO: Check if its night, if it is drain more temperature
    // TODO: Check if a player is standing near a fire, if they are increase temperature
    // TODO: Check if the player is standing too close to a fire, if they are, drain health
    // TODO: Check if the player used a potion, if they did, add more health

    setInterval(() => {
      const sockets = getSockets(this.io);

      sockets.forEach((socket) => {
        const { player } = socket;

        player.drainStat("hunger", 1.5);
        player.drainStat("temperature", 2);

        if ([player.temperature, player.hunger].every((stat) => stat >= 70)) {
          player.fillStat("health", 10);
        } else {
          if (player.temperature === 0) {
            player.drainStat("health", 10);
          }

          if (player.hunger === 0) {
            player.drainStat("health", 20);
          }
        }

        socket.emit("tick", {
          stats: player.getPrivateState()
        });
      });
    }, time);
  }
}

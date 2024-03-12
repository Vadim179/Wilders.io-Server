import { Server } from "socket.io";
import { getSockets } from "@/helpers/getSockets";

/**
 * This is the main class of the game. It allows the game to run.
 */
export class GameLoop {
  private static iterationsPerSecond = 1000 / 15;
  private static lastUpdate = Date.now();

  /**
   * This function is called on every game iteration (iterationsPerSecond)
   *
   * @param io Socket.io Server
   *
   * @returns {void}
   */
  private static handleIteration(io: Server) {
    const sockets = getSockets(io);

    // Update all player entities
    sockets.forEach((socket) => {
      socket.player.calculatePosition();
    });
  }

  /**
   * Start game loop
   *
   * @param io Socket.io Server
   *
   * @returns {this}
   */
  static startLoop(io: Server) {
    setInterval(() => {
      const now = Date.now();
      const elapsed = now - this.lastUpdate;

      if (elapsed > this.iterationsPerSecond) {
        this.lastUpdate = now - (elapsed % this.iterationsPerSecond);
        this.handleIteration(io);
      }
    }, this.iterationsPerSecond);
    console.log("- Game loop started.".cyan);
    return this;
  }
}

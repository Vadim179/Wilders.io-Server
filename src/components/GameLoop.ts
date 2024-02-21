import { Server } from "socket.io";
import { getSockets } from "@/helpers/getSockets";

/**
 * This is the main class of the game. It allows the game to run.
 */
export class GameLoop {
  private static iterationsPerSecond = 1000 / 60;

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

    // Emit player data to all clients
    sockets.forEach((socket) => {
      socket.emit("update", socket.player.getPublicState());
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
    setInterval(() => this.handleIteration(io), this.iterationsPerSecond);
    console.log("- Game loop started.".cyan);
    return this;
  }
}

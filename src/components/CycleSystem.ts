import { Server } from "socket.io";
import { getSockets } from "../helpers/getSockets";

/**
 * Used to handle in-game cycles like player stats, time-cycle, etc.
 */
export class CycleSystem {
  private static cycleDuration = 1000 * 5;

  /**
   * This function is called on every cycle iteration
   *
   * @param io Socket.io Server
   *
   * @returns {void}
   */
  private static handleCycleIteration(io: Server) {
    const sockets = getSockets(io);

    sockets.forEach((socket) => {
      socket.player.handleCycle();
    });
  }

  /**
   * Start cycle system
   *
   * @param io Socket.io Server
   *
   * @returns {this}
   */
  static startCycle(io: Server) {
    setInterval(() => this.handleCycleIteration(io), this.cycleDuration);
    return this;
  }
}

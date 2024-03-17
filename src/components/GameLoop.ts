import { CustomWsServer } from "ws";

/**
 * This is the main class of the game. It allows the game to run.
 */
export class GameLoop {
  private static iterationsPerSecond = 1000 / 20;
  private static lastUpdate = Date.now();

  /**
   * This function is called on every game iteration (iterationsPerSecond)
   *
   * @param ws CustomWsServer
   *
   * @returns {void}
   */
  private static handleTick(ws: CustomWsServer) {
    ws.clients.forEach((socket) => socket.player.handleTick());
  }

  /**
   * Start game loop
   *
   * @param ws CustomWsServer
   *
   * @returns {this}
   */
  static startLoop(ws: CustomWsServer) {
    setInterval(() => {
      const now = Date.now();
      const elapsed = now - this.lastUpdate;

      if (elapsed > this.iterationsPerSecond) {
        this.lastUpdate = now - (elapsed % this.iterationsPerSecond);
        this.handleTick(ws);
      }
    }, this.iterationsPerSecond);
    console.log("- Game loop started.".cyan);
    return this;
  }
}

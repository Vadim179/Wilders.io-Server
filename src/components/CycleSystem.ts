import { physicsEngine } from "./PhysicsEngine";
import { Collectable } from "@/entities/Collectable";
import { CustomWsServer } from "ws";

/**
 * Used to handle in-game cycles like player stats, time-cycle, etc.
 */
export class CycleSystem {
  private static cycleDuration = 1000 * 5;

  /**
   * This function is called on every cycle iteration
   *
   * @param ws CustomWsServer
   *
   * @returns {void}
   */
  private static handleCycleIteration(ws: CustomWsServer) {
    ws.clients.forEach((socket) => {
      socket.player.handleCycle();
    });

    for (const body of physicsEngine.getBodies()) {
      if (body.ownerClass instanceof Collectable) {
        body.ownerClass.regenerate();
      }
    }
  }

  /**
   * Start cycle system
   *
   * @param ws CustomWsServer
   *
   * @returns {this}
   */
  static startCycle(ws: CustomWsServer) {
    setInterval(() => this.handleCycleIteration(ws), this.cycleDuration);
    console.log("- Cycle system started.".cyan);
    return this;
  }
}

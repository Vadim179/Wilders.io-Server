import { Item } from "@/enums/itemEnum";
import { SocketEvent } from "@/enums/socketEvent";
import { sendBinaryDataToClient } from "@/helpers/sendBinaryDataToClient";
import { CustomWsServer } from "ws";

interface PlayerPayload {
  i: number;

  x?: number;
  y?: number;
  a?: number; // angle

  b?: Item | null; // hand item
  c?: Item | null; // head item

  d?: number; // health
  e?: number; // temperature
  f?: number; // hunger
}

/**
 * This is the main class of the game. It allows the game to run.
 */
export class GameLoop {
  private static iterationsPerSecond = 1000 / 15;
  private static lastUpdate = Date.now();
  private static previousPlayerPayloads: Record<string, PlayerPayload> = {};

  /**
   * This function is called on every game iteration (iterationsPerSecond)
   *
   * @param ws CustomWsServer
   *
   * @returns {void}
   */
  private static handleTick(ws: CustomWsServer) {
    ws.clients.forEach((socket) => socket.player.handleTick());

    const currentPlayerPayloads = Array.from(ws.clients).reduce(
      (acc, socket) => {
        const player = socket.player;

        acc[player.id] = {
          i: player.id,
          x: Math.round(player.body.position.x),
          y: Math.round(player.body.position.y),
          a: player.angle,
          b: player.weaponOrTool,
          c: player.helmet,
          d: Math.round(player.health),
          e: Math.round(player.temperature),
          f: Math.round(player.hunger),
        };

        return acc;
      },
      {} as Record<string, PlayerPayload>,
    );

    const finalPlayerPayloads = Object.values(currentPlayerPayloads).reduce(
      (acc, payload) => {
        const previousPayload = this.previousPlayerPayloads[payload.i];

        if (previousPayload) {
          const finalPayload = {} as PlayerPayload;

          Object.keys(payload).forEach((key) => {
            const k = key as keyof PlayerPayload;

            if (payload[k] !== this.previousPlayerPayloads[payload.i][k]) {
              finalPayload[k] = payload[k] as number;
            }
          });

          if (Object.keys(finalPayload).length > 0) {
            finalPayload.i = payload.i;
          }

          acc[payload.i] = finalPayload;
        }

        this.previousPlayerPayloads[payload.i] = { ...payload };
        return acc;
      },
      {} as Record<string, PlayerPayload>,
    );

    ws.clients.forEach((socket) => {
      const packet: PlayerPayload[] = [];
      const player = socket.player;

      const playerPayload = finalPlayerPayloads[player.id];

      if (playerPayload && Object.keys(playerPayload).length > 0) {
        packet.push(playerPayload);
      }

      player.nearbyPlayers.forEach((nearbyPlayer) => {
        const nearbyPlayerPayload = finalPlayerPayloads[nearbyPlayer.id];

        if (
          nearbyPlayerPayload &&
          Object.keys(nearbyPlayerPayload).length > 0
        ) {
          packet.push(nearbyPlayerPayload);
        }
      });

      if (packet.length > 0) {
        sendBinaryDataToClient(socket, SocketEvent.Tick, packet);
      }
    });
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

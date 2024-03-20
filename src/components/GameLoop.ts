import { Item } from "@/enums/itemEnum";
import { SocketEvent } from "@/enums/socketEvent";
import { sendBinaryDataToClient } from "@/helpers/sendBinaryDataToClient";
import { CustomWsServer } from "ws";

interface PlayerPayload {
  id: number;
  x: number;
  y: number;
  angle: number;
  weaponOrTool: Item | null;
  helmet: Item | null;
  health: number;
  temperature: number;
  hunger: number;
}

/**
 * This is the main class of the game. It allows the game to run.
 */
export class GameLoop {
  private static iterationsPerSecond = 1000 / 12;
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
          id: player.id,
          x: Math.round(player.body.position.x),
          y: Math.round(player.body.position.y),
          angle: player.angle,
          weaponOrTool: player.weaponOrTool,
          helmet: player.helmet,
          health: Math.round(player.health),
          temperature: Math.round(player.temperature),
          hunger: Math.round(player.hunger),
        };

        return acc;
      },
      {} as Record<string, PlayerPayload>,
    );

    const changedPlayers = Object.values(currentPlayerPayloads).reduce(
      (acc, payload) => {
        const previousPayload = this.previousPlayerPayloads[payload.id];

        if (previousPayload) {
          const hasChanged = Object.keys(payload).some((key) => {
            const k = key as keyof PlayerPayload;
            return payload[k] !== previousPayload[k];
          });

          if (hasChanged) {
            acc[payload.id] = { ...payload };
          }
        }

        this.previousPlayerPayloads[payload.id] = { ...payload };
        return acc;
      },
      {} as Record<string, PlayerPayload>,
    );

    const mapPayloadToArr = (payload: PlayerPayload) => [
      payload.id,
      payload.x,
      payload.y,
      payload.angle,
      payload.weaponOrTool,
      payload.helmet,
      payload.health,
      payload.temperature,
      payload.hunger,
    ];

    ws.clients.forEach((socket) => {
      const packet = [];
      const player = socket.player;
      const playerPayload = changedPlayers[player.id];

      if (playerPayload) {
        packet.push(mapPayloadToArr(playerPayload));
      }

      player.nearbyPlayers.forEach((nearbyPlayer) => {
        const nearbyPlayerPayload = changedPlayers[nearbyPlayer.id];

        if (nearbyPlayerPayload) {
          packet.push(mapPayloadToArr(nearbyPlayerPayload));
        }
      });

      if (packet.length > 0) {
        sendBinaryDataToClient(socket, SocketEvent.Tick, packet.flat());
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
    }, this.iterationsPerSecond / 2);
    console.log("- Game loop started.".cyan);
    return this;
  }
}

import { CustomWsServer, WebSocket } from "ws";
import { Player } from "./entities/Player";
import { ClientSocketEvent, ServerSocketEvent } from "./enums/socketEvent";

import { gameLoop } from "./components/GameLoop";
import { Crafting } from "./components/Crafting";
import { regenerativeMobRegistry } from "./components/RegenerativeMobRegistry";

import { decodeBinaryDataFromClient } from "./helpers/decodeBinaryDataFromClient";
import { decodeMovement } from "./helpers/decodeMovement";

import {
  broadcastEmit,
  broadcastEmitToNearbyPlayers,
} from "./helpers/socketEmit";

export function initializeGame(ws: CustomWsServer) {
  gameLoop.startLoop(ws);
  regenerativeMobRegistry.initialize(ws);

  ws.on("connection", (socket: WebSocket) => {
    const player = new Player(socket, ws);

    let lastAttackTime = 0;
    let attackInterval: NodeJS.Timeout;
    const attackDelay = 500;

    socket.onmessage = function (message) {
      console.log(
        `Received message from client [${Date.now()}]`.black.bgYellow,
      );
      const [event, data] = decodeBinaryDataFromClient(message.data);

      switch (event) {
        case ClientSocketEvent.Join:
          player.username = data;
          console.log(`- Player [${data.underline}] joined.`.yellow);
          broadcastEmit(player.id, ws, ServerSocketEvent.PlayerInitialization, [
            player.id,
            player.username,
            Math.round(player.body.position.x),
            Math.round(player.body.position.y),
            player.angle,
          ]);
          break;
        case ClientSocketEvent.Move:
          const { x, y } = decodeMovement(data);
          player.setDirection(x, y);
          break;
        case ClientSocketEvent.AttackStart:
          const now = Date.now();

          if (now - lastAttackTime >= attackDelay) {
            lastAttackTime = now;

            if (!player.isAttacking) {
              player.isAttacking = true;
              player.attack();

              attackInterval = setInterval(() => {
                if (player.isAttacking) player.attack();
              }, attackDelay);
            }
          }
          break;
        case ClientSocketEvent.AttackStop:
          player.isAttacking = false;
          clearInterval(attackInterval);
          break;
        case ClientSocketEvent.Craft:
          Crafting.craft(player.inventory, data);
          break;
        case ClientSocketEvent.UseItem:
          player.useItem(data);
          break;
        case ClientSocketEvent.Rotate:
          player.setAngle(data);
          break;
        case ClientSocketEvent.Chat:
          broadcastEmitToNearbyPlayers(player, ServerSocketEvent.Chat, [
            player.id,
            data.slice(0, 64),
          ]);
          break;
      }
    };

    socket.on("close", () => player.destroy());
  });
}

import { CustomWsServer, WebSocket } from "ws";
import { Player } from "./entities/Player";
import { SocketEvent } from "./enums/socketEvent";

import { CycleSystem } from "./components/CycleSystem";
import { GameLoop } from "./components/GameLoop";
import { Crafting } from "./components/Crafting";

import { decodeBinaryDataFromClient } from "./helpers/decodeBinaryDataFromClient";
import { decodeMovement } from "./helpers/decodeMovement";

export function initializeGame(ws: CustomWsServer) {
  CycleSystem.startCycle(ws), GameLoop.startLoop(ws);

  ws.on("connection", (socket: WebSocket) => {
    const player = new Player(socket);

    let lastAttackTime = 0;
    let attackInterval: NodeJS.Timeout;
    const attackDelay = 500;

    socket.onmessage = function (message) {
      console.log(
        `Received message from client [${Date.now()}]`.black.bgYellow,
      );
      const [event, data] = decodeBinaryDataFromClient(message.data);

      switch (event) {
        case SocketEvent.Move:
          const { x, y } = decodeMovement(data);
          player.setDirection(x, y);
          break;
        case SocketEvent.AttackStart:
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
        case SocketEvent.AttackStop:
          player.isAttacking = false;
          clearInterval(attackInterval);
          break;
        case SocketEvent.Craft:
          Crafting.craft(player.inventory, data);
          break;
        case SocketEvent.UseItem:
          player.useItem(data);
          break;
        case SocketEvent.Rotate:
          player.setAngle(data);
          break;
      }
    };

    socket.on("close", () => {
      player.destroy();
    });
  });
}

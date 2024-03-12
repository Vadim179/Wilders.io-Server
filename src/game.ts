import Matter from "matter-js";
import { Server } from "socket.io";

import { Player } from "./entities/Player";
import { physicsEngine } from "./components/PhysicsEngine";
import { CycleSystem } from "./components/CycleSystem";
import { GameLoop } from "./components/GameLoop";
import { Item } from "./enums/itemEnum";
import { Crafting } from "./components/Crafting";
import { SocketEvent } from "./enums/socketEvent";

export function initializeGame(io: Server) {
  CycleSystem.startCycle(io), GameLoop.startLoop(io);

  io.on("connection", (socket) => {
    const player = new Player(socket, io);

    // Handle player actions
    socket.on(SocketEvent.Move, ([direction, value]: number[]) => {
      player.setDirection(direction, value);
    });

    socket.on(SocketEvent.Rotate, (angle: number) => {
      player.setAngle(angle);
    });

    socket.on(SocketEvent.Craft, (item: Item) => {
      Crafting.craft(player.inventory, item);
    });

    socket.on(SocketEvent.UseItem, (slotIndex: number) => {
      player.useItem(slotIndex);
    });

    let lastAttackTime = 0;
    let attackInterval: NodeJS.Timeout;
    const attackDelay = 500;

    socket.on(SocketEvent.AttackStart, () => {
      const now = Date.now();

      if (now - lastAttackTime >= attackDelay) {
        lastAttackTime = now;

        if (!player.isAttacking) {
          player.isAttacking = true;
          player.attack();

          attackInterval = setInterval(() => {
            if (player.isAttacking) {
              player.attack();
            }
          }, attackDelay);
        }
      }
    });

    socket.on(SocketEvent.AttackStop, () => {
      player.isAttacking = false;
      clearInterval(attackInterval);
    });

    // * DEBUGGING
    socket.on("requestPhysicsData", () => {
      const bodiesData = Matter.Composite.allBodies(
        physicsEngine.getWorld(),
      ).map((body) => ({
        position: body.position,
        angle: body.angle,
        radius: body.circleRadius,
        label: body.label,
      }));

      socket.emit("physicsData", bodiesData);
    });

    // Handle player disconnect
    socket.on("disconnect", () => {
      player.destroy();
    });
  });
}

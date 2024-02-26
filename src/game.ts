import Matter from "matter-js";
import { Server } from "socket.io";

import { Player } from "./entities/Player";
import { physicsEngine } from "./components/PhysicsEngine";
import { CycleSystem } from "./components/CycleSystem";
import { GameLoop } from "./components/GameLoop";
import { Item } from "./enums/itemEnum";
import { Crafting } from "./components/Crafting";

export function initializeGame(io: Server) {
  CycleSystem.startCycle(io), GameLoop.startLoop(io);

  io.on("connection", (socket) => {
    const player = new Player(socket);

    // Handle player actions
    socket.on("move", ([direction, value]: ["x" | "y", number]) => {
      player.setDirection(direction, value);
    });

    socket.on("rotate", (angle: number) => {
      player.setAngle(angle);
    });

    socket.on("craft", (item: Item) => {
      Crafting.craft(player.inventory, item);
    });

    socket.on("attack", () => {
      player.attack();
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

import Matter from "matter-js";
import { Server } from "socket.io";
import { IExtendedSocket } from "types";
import { GameMap } from "./config";
import { PhysicsEngine } from "./PhysicsEngine";
import { getRandomSpawnPosition } from "./utils";
import { Player } from "./Player";

export function SocketListener(io: Server) {
  const engine = new PhysicsEngine().load(
    ...GameMap.entities.map(({ x, y }) => {
      // TODO: Create radius config
      return Matter.Bodies.circle(x, y, 60, { isStatic: true });
    })
  );

  engine.update(() => handleEngineTick(io)).run();

  io.on("connection", (socket) => {
    const mySocket = socket as IExtendedSocket;

    const spawnPosition = getRandomSpawnPosition();
    mySocket.emit("spawn", spawnPosition);

    mySocket.player = new Player({
      id: mySocket.id,
      username: mySocket.handshake.query.username as string,
      body: engine.loadPlayer(spawnPosition)
    });

    mySocket.on("move", ([direction, value]: ["x" | "y", number]) => {
      mySocket.player[direction] = value;
    });

    mySocket.on("rotate", (rotation: number) => {
      mySocket.player.rotation = rotation;
      Matter.Body.setAngle(mySocket.player.body, rotation);
    });

    mySocket.on("attack", (attacking: boolean) => {
      if (attacking && Date.now() - mySocket.player.lastAttack > 500) {
        mySocket.player.lastAttack = Date.now();
        mySocket.player.attacking = attacking;
        return;
      }

      mySocket.player.attacking = false;
    });
  });
}

function handleEngineTick(io: Server) {
  const namespace = io.of("/");

  const sockets = Object.values(
    Object.fromEntries(namespace.sockets.entries())
  ) as Array<IExtendedSocket>;

  sockets.forEach((socket) => {
    socket.player.update();
  });

  const clientData = sockets.map((socket) => socket.player.getClientData());

  sockets.forEach((socket) => {
    socket.emit("update", clientData);
  });
}

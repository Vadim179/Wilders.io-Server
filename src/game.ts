import Matter from "matter-js";
import { Server } from "socket.io";
import { IExtendedSocket } from "types";
import { GameMap } from "./config";
import { PhysicsEngine, Tick } from "./components";
import { getRandomSpawnPosition, getSockets } from "./utils";
import { Player } from "./entities";

export function initializeGame(io: Server) {
  // Create physics engine
  const engine = new PhysicsEngine().load(
    ...GameMap.entities.map(({ type, x, y }) => {
      // TODO: Create radius config
      const body = Matter.Bodies.circle(x, y, 60, { isStatic: true });
      body.label = type;
      return body;
    })
  );

  // Start the physics engine
  engine.update(() => handleEngineTick(io)).run();

  // Start player stats timer
  new Tick(io).start();

  // Handle player connection
  io.on("connection", (socket) => {
    const mySocket = socket as IExtendedSocket;

    // Create player entity
    const spawnPosition = getRandomSpawnPosition();

    mySocket.player = new Player({
      id: mySocket.id,
      username: mySocket.handshake.query.username as string,
      body: engine.loadPlayer(spawnPosition)
    }).start();

    mySocket.emit("spawn", spawnPosition);

    // Handle player actions
    mySocket.on("move", ([direction, value]: ["x" | "y", number]) => {
      mySocket.player[direction] = value;
    });

    mySocket.on("rotate", (rotation: number) => {
      mySocket.player.rotation = rotation;
      Matter.Body.setAngle(mySocket.player.body, rotation);
    });

    mySocket.on("attack", () => {
      // TODO: Make the engine world global
      mySocket.player.attack(engine.engine.world);
    });

    // Handle player disconnect
    mySocket.on("disconnect", () => {
      // TODO: Make the engine world global
      mySocket.player.destroy(engine.engine.world);
    });
  });
}

function handleEngineTick(io: Server) {
  const sockets = getSockets(io);

  // Update all player entities
  sockets.forEach((socket) => {
    socket.player.update();
  });

  // Emit player data to all clients
  sockets.forEach((socket) => {
    socket.emit("update", socket.player.getPublicState());
  });
}

import { Server } from "socket.io";

export function getSockets(io: Server) {
  const namespace = io.of("/");

  return Object.values(Object.fromEntries(namespace.sockets.entries()));
}

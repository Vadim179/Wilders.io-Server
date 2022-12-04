import { Server } from "socket.io";
import { IExtendedSocket } from "types";

export function getSockets(io: Server) {
  const namespace = io.of("/");

  return Object.values(
    Object.fromEntries(namespace.sockets.entries())
  ) as Array<IExtendedSocket>;
}

import { SocketEvent } from "@/enums/socketEvent";
import { CustomWsServer, WebSocket } from "ws";
import { sendBinaryDataToClient } from "./sendBinaryDataToClient";
import { Player } from "@/entities/Player";

export function broadcastEmit(
  id: number,
  ws: CustomWsServer,
  eventName: SocketEvent,
  data: any,
) {
  ws.clients.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN && socket.id !== id) {
      sendBinaryDataToClient(socket, eventName, data);
    }
  });
}

export function broadcastEmitToNearbyPlayers(
  player: Player,
  eventName: SocketEvent,
  data: any,
) {
  player.nearbyPlayers.forEach((nearbyPlayer) => {
    const socket = nearbyPlayer.socket;
    if (socket.readyState === WebSocket.OPEN) {
      sendBinaryDataToClient(socket, eventName, data);
    }
  });
}

export function emitToAll(
  ws: CustomWsServer,
  eventName: SocketEvent,
  data: any,
) {
  ws.clients.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      sendBinaryDataToClient(socket, eventName, data);
    }
  });
}

import { WebSocket } from "ws";
import MsgPack from "msgpack-lite";
import { SocketEvent } from "@/enums/socketEvent";

let totalBytesSent = 0;

export function sendBinaryDataToClient(
  ws: WebSocket,
  event: SocketEvent,
  data?: any,
) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error("WebSocket is not open.");
    return;
  }

  const messageObject = [event];
  if (data !== undefined) messageObject.push(data);
  const message = MsgPack.encode(messageObject);

  const messageSize = message.byteLength;
  totalBytesSent += messageSize;
  console.log(
    `Sent message to the client [${Date.now()}] {${messageSize} | ${totalBytesSent}}`
      .black.bgCyan,
  );
  ws.send(message, { binary: true }, (error) => {
    if (error) {
      console.error("Error sending binary data:", error);
      return;
    }
  });
}

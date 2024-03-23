import { WebSocket } from "ws";
import MsgPack from "msgpack-lite";
import { ServerSocketEvent } from "@/enums/socketEvent";

let totalBytesSent = 0;
let time = Date.now();

export function sendBinaryDataToClient(
  ws: WebSocket,
  event: ServerSocketEvent,
  data?: any,
  tdebug = false,
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

  const timeDiff = (Date.now() - time) / 1000;

  if (tdebug) {
    console.log(
      `Sent debug message to the client {${messageSize} | ${totalBytesSent}}`
        .black.bgMagenta,
    );
  } else {
    console.log(
      `Sent message to the client [${timeDiff}s] {${messageSize} | ${totalBytesSent} | ${
        totalBytesSent / timeDiff
      }bps}`.black.bgCyan,
    );
  }

  ws.send(message, { binary: true }, (error) => {
    if (error) {
      console.error("Error sending binary data:", error);
      return;
    }
  });
}

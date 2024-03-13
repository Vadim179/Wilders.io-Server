import * as MsgPack from "msgpack-lite";

export function decodeBinaryDataFromClient(data: ArrayBuffer) {
  const decoded = MsgPack.decode(new Uint8Array(data));
  return decoded;
}

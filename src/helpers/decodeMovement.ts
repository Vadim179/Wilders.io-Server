export function decodeMovement(byte: number) {
  const x = byte & 0b11;
  const y = (byte >> 2) & 0b11;
  return { x, y };
}

// TODO: Separate into client and server enums
export enum SocketEvent {
  MovementUpdate = 0x00,
  Move = 0x01,
  Attack = 0x02,
  AttackOther = 0x03,
  Rotate = 0x04,
  InventoryUpdate = 0x05,
  AttackStart = 0x06,
  AttackStop = 0x07,
  Craft = 0x08,
  StatsUpdate = 0x09,
  RotateOther = 0x0a,
  HelmetUpdate = 0x0b,
  HelmetUpdateOther = 0x0c,
  WeaponOrToolUpdate = 0x0d,
  WeaponOrToolUpdateOther = 0x0e,
  Init = 0x10,
  MovementUpdateOther = 0x11,
  UseItem = 0x12,
  UseItemOther = 0x13,
  PlayerInitialization = 0x14,
  PlayerRemove = 0x15,
  Join = 0x16,
  Chat = 0x17,
}

export enum ServerSocketEvent {
  Tick = 0x00,
  Attack = 0x01,
  AttackOther = 0x02,
  InventoryUpdate = 0x03,
  StatsUpdate = 0x04,
  GameInit = 0x05,
  PlayerInitialization = 0x06,
  PlayerRemove = 0x07,
  Chat = 0x08,
  MobInitialization = 0x09,
  MobRemove = 0x0a,
}

export enum ClientSocketEvent {
  Rotate = 0x00,
  Move = 0x01,
  AttackStart = 0x02,
  AttackStop = 0x03,
  Craft = 0x04,
  UseItem = 0x05,
  Chat = 0x06,
  Join = 0x07,
}

interface IGamePhysicsConfig {
  gravity: {
    x: number
    y: number
  }

  wilderFrictionAir: number
  wilderSpeed: number
  ticksPerSecond: number

  colliderRadiuses: {
    [key: string]: number
  }
}

export const GamePhysicsConfig = Object.freeze({
  gravity: { x: 0, y: 0 },
  wilderFrictionAir: 0.25,
  wilderSpeed: 0.025,
  ticksPerSecond: 20,
  colliderRadiuses: {
    AppleTree: 60,
    Bush: 60,
    LargeCopperOre: 60,
    LargeDarkOakTree: 60,
    LargeGoldOre: 60,
    LargeIronOre: 60,
    LargeOakTree: 60,
    LargeRock: 80,
    MediumDarkOakTree: 60,
    MediumOakTree: 60,
    SmallCopperOre: 60,
    SmallDarkOakTree: 60,
    SmallGoldOre: 60,
    SmallIronOre: 60,
    SmallOakTree: 60,
    SmallRock: 60,
    Wilder: 30,
  },
} as IGamePhysicsConfig)

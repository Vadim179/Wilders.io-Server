import { IPosition } from "types"

interface IGameMapEntity extends IPosition {
  id: string
}

interface IGameMap {
  width: number
  height: number
  entities: Array<IGameMapEntity>
}

export const GameMap = Object.freeze({
  width: 1000,
  height: 1000,
  entities: [
    { id: "LargeRock", x: 350, y: 50 },
    { id: "MediumDarkOakTree", x: 500, y: 250 },
    { id: "LargeOakTree", x: 650, y: 150 },
  ],
} as IGameMap)
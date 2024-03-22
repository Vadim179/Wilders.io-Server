import { Item } from "@/enums/itemEnum";
import { EntitySize } from "@/enums/entitySizeEnum";
import { CollectRank } from "@/enums/collectRankEnum";

export const map = {
  spawners: [
    {
      x: 0,
      y: 0,
    },
  ],
  mobSpawners: [
    {
      x: 100,
      y: 0,
    },
  ],
  size: {
    width: 1000,
    height: 1000,
  },
  collectables: [
    {
      id: "stone-1",
      item: Item.Stone,
      size: EntitySize.Large,
      radius: 60,
      x: 350,
      y: 50,
    },
    {
      id: "tree-1",
      item: Item.Wood,
      size: EntitySize.Medium,
      radius: 60,
      x: 500,
      y: 250,
    },
    {
      id: "tree-2",
      item: Item.Wood,
      size: EntitySize.Large,
      radius: 60,
      x: 650,
      y: 150,
    },
  ],
};

export const collectableSizeToOptions = {
  [EntitySize.Small]: {
    storageAmount: 30,
    regenerationAmount: 2,
  },
  [EntitySize.Medium]: {
    storageAmount: 45,
    regenerationAmount: 3,
  },
  [EntitySize.Large]: {
    storageAmount: 60,
    regenerationAmount: 4,
  },
};

export const itemToCollectRank: Record<number, CollectRank> = {
  [Item.Wood]: CollectRank.R1,
  [Item.Stone]: CollectRank.R2,
};

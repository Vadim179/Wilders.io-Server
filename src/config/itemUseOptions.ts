import { CollectRank } from "@/enums/collectRankEnum";
import { ItemCategory } from "@/enums/itemCategoryEnum";
import { Item } from "@/enums/itemEnum";

export const itemCategoryMap: Record<number, ItemCategory> = {
  [Item.Wood]: ItemCategory.Resource,
  [Item.Stone]: ItemCategory.Resource,
  [Item.Apple]: ItemCategory.Food,
  [Item.WoodHelmet]: ItemCategory.Helmet,
  [Item.WoodPickaxe]: ItemCategory.Pickaxe,
  [Item.WoodSword]: ItemCategory.Weapon,
  [Item.StoneHelmet]: ItemCategory.Helmet,
  [Item.StonePickaxe]: ItemCategory.Pickaxe,
  [Item.StoneSword]: ItemCategory.Weapon,
  [Item.RawMeat]: ItemCategory.Food,
  [Item.WolfFur]: ItemCategory.Resource,
};

export interface HelmetResistanceMap {
  fromPlayer: number;
  fromMobs: number;
}

export const helmetResistanceMap: Record<number, HelmetResistanceMap> = {
  [Item.WoodHelmet]: { fromPlayer: 1, fromMobs: 4 },
  [Item.StoneHelmet]: { fromPlayer: 2, fromMobs: 8 },
};

export interface WeaponDamageMap {
  againstEntity: number;
  againstBuildings: number;
}
export interface toolRangeAndRadiusMap {
  toolRange: number;
  toolRadius: number;
}

export const weaponDamageMap: Record<number, WeaponDamageMap> = {
  [Item.WoodPickaxe]: { againstEntity: 5, againstBuildings: 5 },
  [Item.StonePickaxe]: { againstEntity: 5, againstBuildings: 5 },
  [Item.IronPickaxe]: { againstEntity: 5, againstBuildings: 5 },
  [Item.GoldPickaxe]: { againstEntity: 5, againstBuildings: 5 },
  [Item.DiamondPickaxe]: { againstEntity: 5, againstBuildings: 5 },
  [Item.EmeraldPickaxe]: { againstEntity: 5, againstBuildings: 5 },
  [Item.WoodSword]: { againstEntity: 12, againstBuildings: 4 },
  [Item.StoneSword]: { againstEntity: 19, againstBuildings: 6 },
  [Item.IronSword]: { againstEntity: 22, againstBuildings: 7 },
  [Item.GoldSword]: { againstEntity: 24, againstBuildings: 8 },
  [Item.DiamondSword]: { againstEntity: 27, againstBuildings: 9 },
  [Item.EmeraldSword]: { againstEntity: 30, againstBuildings: 10 },
};

export const toolRangeAndRadiusMap: Record<number, toolRangeAndRadiusMap> = {
  [Item.WoodPickaxe]: { toolRange: 60, toolRadius: 40 },
  [Item.StonePickaxe]: { toolRange: 60, toolRadius: 40 },
  [Item.IronPickaxe]: { toolRange: 60, toolRadius: 40 },
  [Item.GoldPickaxe]: { toolRange: 60, toolRadius: 40 },
  [Item.DiamondPickaxe]: { toolRange: 60, toolRadius: 40 },
  [Item.EmeraldPickaxe]: { toolRange: 60, toolRadius: 40 },
  [Item.WoodSword]: { toolRange: 80, toolRadius: 40 },
  [Item.StoneSword]: { toolRange: 80, toolRadius: 40 },
  [Item.IronSword]: { toolRange: 80, toolRadius: 40 },
  [Item.GoldSword]: { toolRange: 80, toolRadius: 40 },
  [Item.DiamondSword]: { toolRange: 80, toolRadius: 40 },
  [Item.EmeraldSword]: { toolRange: 80, toolRadius: 40 },
};

export const playerSpeedWithEquippedToolMap: Record<number, number> = {
  [Item.WoodPickaxe]: 12,
  [Item.StonePickaxe]: 12,
  [Item.IronPickaxe]: 12,
  [Item.GoldPickaxe]: 12,
  [Item.DiamondPickaxe]: 12,
  [Item.EmeraldPickaxe]: 12,
  [Item.WoodSword]: 10,
  [Item.StoneSword]: 10,
  [Item.IronSword]: 10,
  [Item.GoldSword]: 10,
  [Item.DiamondSword]: 10,
  [Item.EmeraldSword]: 10,
};

export const pickaxeCollectRankMap: Record<number, CollectRank> = {
  [Item.WoodPickaxe]: CollectRank.R2,
  [Item.StonePickaxe]: CollectRank.R3,
};

export const foodRestoreMap: Record<number, number> = {
  [Item.Apple]: 10,
  [Item.RawMeat]: 2,
};

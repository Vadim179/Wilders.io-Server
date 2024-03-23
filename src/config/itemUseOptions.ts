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

export const pickaxeCollectRankMap: Record<number, CollectRank> = {
  [Item.WoodPickaxe]: CollectRank.R2,
  [Item.StonePickaxe]: CollectRank.R3,
};

export const foodRestoreMap: Record<number, number> = {
  [Item.Apple]: 10,
  [Item.RawMeat]: 2,
};

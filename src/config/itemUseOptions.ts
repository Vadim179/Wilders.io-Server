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
};

export const helmetResistanceMap: Record<number, number> = {
  [Item.WoodHelmet]: 5,
};

export const weaponDamageMap: Record<number, number> = {
  [Item.WoodSword]: 10,
};

export const pickaxeCollectRankMap: Record<number, CollectRank> = {
  [Item.WoodPickaxe]: CollectRank.R2,
};

export const foodRestoreMap: Record<number, number> = {
  [Item.Apple]: 10,
};

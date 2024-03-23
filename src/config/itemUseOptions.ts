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

export const helmetResistanceMap: Record<number, number> = {
  [Item.WoodHelmet]: 5,
  [Item.StoneHelmet]: 10,
};

export const weaponDamageMap: Record<number, number> = {
  [Item.WoodSword]: 10,
  [Item.StoneSword]: 20,
};

export const pickaxeCollectRankMap: Record<number, CollectRank> = {
  [Item.WoodPickaxe]: CollectRank.R2,
  [Item.StonePickaxe]: CollectRank.R3,
};

export const foodRestoreMap: Record<number, number> = {
  [Item.Apple]: 10,
  [Item.RawMeat]: 2,
};

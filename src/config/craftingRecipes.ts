import { Item } from "../enums/itemEnum";

export interface InventoryItemStack {
  item: Item;
  quantity: number;
}

export interface CraftingRecipe {
  item: Item;
  quantity: number;
  ingredients: InventoryItemStack[];
}

export const craftingRecipes: readonly CraftingRecipe[] = [
  {
    item: Item.WoodPickaxe,
    quantity: 1,
    ingredients: [{ item: Item.Wood, quantity: 10 }],
  },
  {
    item: Item.WoodSword,
    quantity: 1,
    ingredients: [{ item: Item.Wood, quantity: 25 }],
  },
  {
    item: Item.WoodHelmet,
    quantity: 1,
    ingredients: [{ item: Item.Wood, quantity: 50 }],
  },
  {
    item: Item.StoneHelmet,
    quantity: 1,
    ingredients: [
      { item: Item.Stone, quantity: 50 },
      { item: Item.Wood, quantity: 25 },
      { item: Item.WoodHelmet, quantity: 1 },
    ],
  },
  {
    item: Item.StoneSword,
    quantity: 1,
    ingredients: [
      { item: Item.Wood, quantity: 20 },
      { item: Item.Stone, quantity: 15 },
      { item: Item.WoodSword, quantity: 1 },
    ],
  },
  {
    item: Item.StonePickaxe,
    quantity: 1,
    ingredients: [
      { item: Item.Wood, quantity: 10 },
      { item: Item.Stone, quantity: 10 },
      { item: Item.WoodPickaxe, quantity: 1 },
    ],
  },
];

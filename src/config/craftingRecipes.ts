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
    ingredients: [{ item: Item.Wood, quantity: 10 }]
  },
  {
    item: Item.WoodSword,
    quantity: 1,
    ingredients: [{ item: Item.Wood, quantity: 25 }]
  }
];

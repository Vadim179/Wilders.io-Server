import { Item } from "@/enums/itemEnum";
import { Inventory } from "./Inventory";
import { craftingRecipes } from "@/config/craftingRecipes";

export class Crafting {
  static craft(inventory: Inventory, item: Item) {
    const recipe = craftingRecipes.find((recipe) => recipe.item === item);

    if (!recipe) {
      console.error("Recipe not found for item:", item);
      return false;
    }

    for (const ingredient of recipe.ingredients) {
      const slots = inventory.getItems();
      const slotWithItem = slots.find((slot) => slot[0] === ingredient.item);

      if (!slotWithItem) {
        console.error(
          "Cannot find slot with ingridient item:",
          ingredient.item,
        );
        return false;
      }

      const amount = slotWithItem[1] as number;
      if (amount < ingredient.quantity) {
        console.error("Not enough ingredients:", ingredient.item);
        return false;
      }
    }

    for (const ingredient of recipe.ingredients) {
      inventory.removeItem(ingredient.item, ingredient.quantity, false);
    }

    inventory.addItem(item, recipe.quantity, false);
    inventory.emitUpdate();
    return true;
  }
}

import Matter from "matter-js";

import { CollectRank } from "@/enums/collectRankEnum";
import { BodyOptions } from "@/types/matterTypes";

import { Item } from "@/enums/itemEnum";
import { EntityTags } from "@/enums/entityTagsEnum";
import { EntityCategories } from "@/enums/entityCategoriesEnum";

interface CollectableOptions extends BodyOptions {
  id: string;
  item: Item;
  storageAmount: number;
  regenerationAmount: number;
  collectRank: CollectRank;
}

interface CollectResult {
  item: Item | null;
  amount: number;
}

export class Collectable {
  id: string;
  body: Matter.Body;
  item: Item;
  storageAmount: number;
  regenerationAmount: number;
  collectRank: CollectRank;
  amount: number;

  constructor(options: CollectableOptions) {
    const {
      id,
      x,
      y,
      radius,
      item,
      storageAmount,
      regenerationAmount,
      collectRank,
    } = options;

    const bodyOptions = {
      label: EntityTags.Collectable,
      isStatic: true,
      collisionFilter: { category: EntityCategories.Collectable },
    };

    this.id = id;
    this.body = Matter.Bodies.circle(x, y, radius, bodyOptions);
    this.body.ownerClass = this;

    this.item = item;
    this.storageAmount = storageAmount;
    this.amount = storageAmount;
    this.regenerationAmount = regenerationAmount;
    this.collectRank = collectRank;
  }

  collect(playerCollectRank: CollectRank): CollectResult {
    if (playerCollectRank < this.collectRank || this.amount === 0)
      return { item: null, amount: 0 };

    const collectedAmount = Math.min(
      this.amount,
      playerCollectRank - this.collectRank + 1,
    );
    this.amount -= collectedAmount;

    return {
      item: this.item,
      amount: collectedAmount,
    };
  }

  regenerate() {
    if (this.amount === this.storageAmount) return;

    this.amount = Math.min(
      this.amount + this.regenerationAmount,
      this.storageAmount,
    );
  }
}

import Matter from "matter-js";

import { CollectRank } from "@/enums/collectRankEnum";
import { BodyOptions } from "@/types/matterTypes";

import { Item } from "@/enums/itemEnum";
import { EntityTags } from "@/enums/entityTagsEnum";
import { EntityCategories } from "@/enums/entityCategoriesEnum";

interface CollectableOptions extends BodyOptions {
  item: Item;
  storageAmount: number;
  regenerationAmount: number;
  collectRank: CollectRank;
}

export class Collectable {
  body: Matter.Body;
  item: Item;
  storageAmount: number;
  regenerationAmount: number;
  collectRank: CollectRank;
  amount: number;

  constructor(options: CollectableOptions) {
    const {
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

    this.body = Matter.Bodies.circle(x, y, radius, bodyOptions);
    this.body.ownerClass = this;

    this.item = item;
    this.storageAmount = storageAmount;
    this.amount = storageAmount;
    this.regenerationAmount = regenerationAmount;
    this.collectRank = collectRank;
  }
}

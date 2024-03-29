import EventEmitter from "events";
import { Item } from "@/enums/itemEnum";
import { InventoryItemStack } from "@/config/craftingRecipes";

class Slot {
  item: Item | null;
  amount: number;

  constructor(item?: Item | null, amount?: number) {
    this.item = item === undefined ? null : item;
    this.amount = amount === undefined ? 0 : amount;
  }

  add(item: Item, amount: number) {
    if (this.item !== null) {
      this.amount += amount;
      return;
    }

    this.item = item;
    this.amount = amount;
  }

  remove(amount: number) {
    if (this.item === null) return;
    this.amount -= amount;

    if (this.amount <= 0) {
      this.item = null;
      this.amount = 0;
    }
  }
}

export class Inventory extends EventEmitter {
  private slotCount = 8;
  private slots: Slot[];
  private previousSlots: Slot[];

  constructor() {
    super();
    this.slots = new Array(this.slotCount).fill(null).map(() => new Slot());
    this.updatePreviousSlots();
  }

  getItems() {
    return this.slots.map((slot) => [slot.item, slot.amount]);
  }

  getChangedSlots() {
    return this.slots
      .map((slot, index) => ({ ...slot, index }))
      .filter(
        (slot, i) =>
          this.previousSlots[i].item !== slot.item ||
          this.previousSlots[i].amount !== slot.amount,
      );
  }

  updatePreviousSlots() {
    this.previousSlots = this.slots.map(
      (slot) => new Slot(slot.item, slot.amount),
    );

    return this;
  }

  addItem(item: Item, amount: number, emit = true) {
    const slot = this.getSlotWithItem(item) || this.getEmptySlot();

    if (slot) {
      slot.add(item, amount);
      if (emit) this.emit("update", this.getItems());
    }

    return this;
  }

  addItems(items: InventoryItemStack[], emit = true) {
    items.forEach(({ item, quantity }) => this.addItem(item, quantity, false));
    if (emit) this.emit("update", this.getItems());
    return this;
  }

  removeItem(item: Item, amount: number, emit = true) {
    const slot = this.getSlotWithItem(item);

    if (slot) {
      slot.remove(amount);

      if (slot.item === null) {
        this.shiftSlots(slot);
      }

      if (emit) this.emit("update", this.getItems());
    }

    return this;
  }

  removeItems(items: InventoryItemStack[], emit = true) {
    items.forEach(({ item, quantity }) =>
      this.removeItem(item, quantity, false),
    );
    if (emit) this.emit("update", this.getItems());
    return this;
  }

  emitUpdate() {
    this.emit("update", this.getItems());

    return this;
  }

  private shiftSlots(slot: Slot) {
    const slotIndex = this.slots.indexOf(slot);

    for (let i = slotIndex; i < this.slots.length - 1; i++) {
      this.slots[i] = this.slots[i + 1];
    }

    this.slots[this.slots.length - 1] = new Slot();
    return this;
  }

  private getSlotWithItem(item: Item) {
    return this.slots.find((slot) => slot.item === item) || null;
  }

  private getEmptySlot() {
    return this.slots.find((slot) => slot.item === null) || null;
  }
}

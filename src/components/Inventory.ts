import EventEmitter from "events";
import { Item } from "@/enums/itemEnum";

class Slot {
  item: Item | null = null;
  amount = 0;

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

  constructor() {
    super();
    this.slots = new Array(this.slotCount).fill(null).map(() => new Slot());
  }

  getItems() {
    return this.slots.map((slot) => [slot.item, slot.amount]);
  }

  addItem(item: Item, amount: number, emit = true) {
    const slot = this.getSlotWithItem(item) || this.getEmptySlot();

    if (slot) {
      slot.add(item, amount);
      if (emit) this.emit("update", this.getItems());
    }
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
  }

  emitUpdate() {
    this.emit("update", this.getItems());
  }

  private shiftSlots(slot: Slot) {
    const slotIndex = this.slots.indexOf(slot);

    for (let i = slotIndex; i < this.slots.length - 1; i++) {
      this.slots[i] = this.slots[i + 1];
    }

    this.slots[this.slots.length - 1] = new Slot();
  }

  private getSlotWithItem(item: Item) {
    return this.slots.find((slot) => slot.item === item) || null;
  }

  private getEmptySlot() {
    return this.slots.find((slot) => slot.item === null) || null;
  }
}

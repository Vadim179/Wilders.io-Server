import { Body } from "matter-js";
import { Collectable } from "@/entities/Collectable";
import { Player } from "@/entities/Player";

declare module "matter-js" {
  interface Body {
    ownerClass: Player | Collectable;
  }
}

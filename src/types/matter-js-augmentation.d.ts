import { Body } from "matter-js";
import { Collectable } from "@/entities/Collectable";
import { Player } from "@/entities/Player";
import { Mob } from "@/entities/Mob";

declare module "matter-js" {
  interface Body {
    ownerClass: Player | Collectable | Mob;
  }
}

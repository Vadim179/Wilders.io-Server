import { Item } from "@/enums/itemEnum";
import { ServerSocketEvent } from "@/enums/socketEvent";
import { sendBinaryDataToClient } from "@/helpers/sendBinaryDataToClient";
import { CustomWsServer } from "ws";
import { regenerativeMobRegistry } from "./RegenerativeMobRegistry";
import { RegenerativeMobRegistryTag } from "@/enums/regenerativeMobRegistryTagEnum";
import { isEntityNearby } from "@/helpers/isEntityNearby";
import { physicsEngine } from "./PhysicsEngine";
import { Collectable } from "@/entities/Collectable";

interface PlayerPayload {
  id: number;
  x?: number;
  y?: number;
  angle: number;
  weaponOrTool: Item | null;
  helmet: Item | null;
  health: number;
  temperature: number;
  hunger: number;
}

interface MobPayload {
  id: number;
  mobTag: RegenerativeMobRegistryTag;
  targetX: number;
  targetY: number;
  health: number;
}

// TODO: Refactor this class to use a more functional approach

export class GameLoop {
  private mainTimerTickRate = 1000 / 15;
  private cycleTimerTickRate = 1000 * 5;

  private previousPlayerPayloads: Record<string, PlayerPayload> = {};
  private previousMobPayloads: Record<string, MobPayload> = {};

  private handleMainTimerTick(ws: CustomWsServer) {
    ws.clients.forEach((socket) => socket.player.handleTick());

    const mobs = regenerativeMobRegistry.getAllMobs();
    mobs.forEach((mob) => mob.handleGameTick(ws));

    const currentPlayerPayloads = Array.from(ws.clients).reduce(
      (acc, socket) => {
        const player = socket.player;

        acc[player.id] = {
          id: player.id,
          x: Math.round(player.body.position.x),
          y: Math.round(player.body.position.y),
          angle: player.angle,
          weaponOrTool: player.weaponOrTool,
          helmet: player.helmet,
          health: Math.round(player.health),
          temperature: Math.round(player.temperature),
          hunger: Math.round(player.hunger),
        };

        return acc;
      },
      {} as Record<string, PlayerPayload>,
    );

    const currentMobPayloads = mobs.reduce((acc, mob) => {
      const mobId = `${mob.mobTag}-${mob.id}`;

      acc[mobId] = {
        id: mob.id,
        mobTag: mob.mobTag,
        targetX: Math.floor(mob.body.position.x),
        targetY: Math.floor(mob.body.position.y),
        health: Math.floor(mob.health),
      };

      return acc;
    }, {} as Record<string, MobPayload>);

    const changedPlayers = Object.values(currentPlayerPayloads).reduce(
      (acc, payload) => {
        const previousPayload = this.previousPlayerPayloads[payload.id];

        if (previousPayload) {
          const hasChanged = Object.keys(payload).some((key) => {
            const k = key as keyof PlayerPayload;
            return payload[k] !== previousPayload[k];
          });

          if (hasChanged) {
            acc[payload.id] = { ...payload };
          }
        }

        this.previousPlayerPayloads[payload.id] = { ...payload };
        return acc;
      },
      {} as Record<string, PlayerPayload>,
    );

    const changedMobs = Object.entries(currentMobPayloads).reduce(
      (acc, [mobId, payload]) => {
        const previousPayload = this.previousMobPayloads[mobId];

        if (previousPayload) {
          const hasChanged = Object.keys(payload).some((key) => {
            const k = key as keyof MobPayload;
            return payload[k] !== previousPayload[k];
          });

          if (hasChanged) {
            acc[mobId] = { ...payload };
          }
        }

        this.previousMobPayloads[mobId] = { ...payload };
        return acc;
      },
      {} as Record<string, MobPayload>,
    );

    const mapPlayerPayloadToArr = (payload: PlayerPayload) => [
      payload.id,
      payload.x,
      payload.y,
      payload.angle,
      payload.weaponOrTool,
      payload.helmet,
      payload.health,
      payload.temperature,
      payload.hunger,
    ];

    const mapMobPayloadToArr = (payload: MobPayload) => [
      payload.mobTag,
      payload.id,
      payload.targetX,
      payload.targetY,
      payload.health,
    ];

    ws.clients.forEach((socket) => {
      const playerArray: ReturnType<typeof mapPlayerPayloadToArr>[] = [];
      const mobArray: ReturnType<typeof mapMobPayloadToArr>[] = [];

      const player = socket.player;
      const playerPayload = changedPlayers[player.id];

      if (playerPayload) {
        playerArray.push(mapPlayerPayloadToArr(playerPayload));
      }

      player.nearbyPlayers.forEach((nearbyPlayer) => {
        const nearbyPlayerPayload = changedPlayers[nearbyPlayer.id];

        if (nearbyPlayerPayload) {
          playerArray.push(mapPlayerPayloadToArr(nearbyPlayerPayload));
        }
      });

      mobs.forEach((mob) => {
        const mobId = `${mob.mobTag}-${mob.id}`;
        const mobPayload = changedMobs[mobId];

        if (mobPayload && isEntityNearby(player.body, mob.body)) {
          mobArray.push(mapMobPayloadToArr(mobPayload));
        }
      });

      const payload = mobArray.length
        ? [playerArray.flat(), mobArray.flat()]
        : playerArray.flat();

      if (playerArray.length || mobArray.length) {
        sendBinaryDataToClient(socket, ServerSocketEvent.Tick, payload);
      }
    });
  }

  private handleCycleTimerTick(ws: CustomWsServer) {
    ws.clients.forEach((socket) => {
      socket.player.handleCycle();
    });

    for (const body of physicsEngine.getBodies()) {
      if (body.ownerClass instanceof Collectable) {
        body.ownerClass.regenerate();
      }
    }
  }

  private createTimer(
    ws: CustomWsServer,
    tickRate: number,
    handleTick: (ws: CustomWsServer) => void,
  ) {
    let mainTimerLastUpdate = Date.now();

    setInterval(() => {
      const now = Date.now();
      const elapsed = now - mainTimerLastUpdate;

      if (elapsed > tickRate) {
        mainTimerLastUpdate = now - (elapsed % tickRate);
        handleTick(ws);
      }
    }, tickRate / 2);
  }

  startLoop(ws: CustomWsServer) {
    this.createTimer(
      ws,
      this.mainTimerTickRate,
      this.handleMainTimerTick.bind(this, ws),
    );
    this.createTimer(
      ws,
      this.cycleTimerTickRate,
      this.handleCycleTimerTick.bind(this, ws),
    );

    console.log("Game loop started.".cyan);
    return this;
  }
}

export const gameLoop = new GameLoop();

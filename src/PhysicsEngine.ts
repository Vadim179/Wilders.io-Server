import Matter from "matter-js"
import { GamePhysicsConfig } from "./config"

type PhysicsEngineUpdateCallback = () => void

export class PhysicsEngine {
  engine: Matter.Engine

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: GamePhysicsConfig.gravity,
    })
  }

  load(...bodies: Array<Matter.Body>) {
    bodies.forEach((body) => Matter.World.add(this.engine.world, body))
    return this
  }

  update(callback: PhysicsEngineUpdateCallback) {
    setInterval(callback, 1000 / GamePhysicsConfig.ticksPerSecond)
    return this
  }

  run() {
    const runner = Matter.Runner.create()
    Matter.Runner.run(runner, this.engine)
    return this
  }
}

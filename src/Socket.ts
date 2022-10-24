import Matter from "matter-js"
import { Server } from "socket.io"
import { ISocket } from "types"
import { GameMap, GamePhysicsConfig } from "./config"
import { PhysicsEngine } from "./PhysicsEngine"
import { getRandomSpawnPosition } from "./utils"
import { Wilder } from "./Wilder"

// ? Initialize the physics engine
const engine = new PhysicsEngine().load(
  ...GameMap.entities.map(({ id, x, y }) => {
    const bodyRadius = GamePhysicsConfig.colliderRadiuses[id]
    return Matter.Bodies.circle(x, y, bodyRadius, { isStatic: true })
  }),
)

const wilderAttackIntervalMap = new Map<string, NodeJS.Timer>()

export function SocketListener(io: Server) {
  // ? Start the physics engine
  engine.update(() => handleEngineTick(io)).run()

  io.on("connection", (socket) => {
    const _socket = socket as ISocket

    // ? Get wilder spawn position
    const { x, y } = getRandomSpawnPosition()

    // ? Create wilder physics body
    const wilderBodyRadius = GamePhysicsConfig.colliderRadiuses.Wilder
    const wilderBody = Matter.Bodies.circle(x, y, wilderBodyRadius, {
      frictionAir: GamePhysicsConfig.wilderFrictionAir,
      friction: 0,
    })

    const wilder = new Wilder({
      id: socket.id,
      username: socket.handshake.query.username as string,
      body: wilderBody,
    })

    // ? Load wilder into the simulation
    engine.load(wilderBody)
    _socket.wilder = wilder
    _socket.emit("i", { x, y })

    // ? OnMovement listener
    _socket.on("m", ([direction, value]: ["h" | "v", number]) => {
      if (direction === "h") {
        _socket.wilder.x = value
        return
      }

      _socket.wilder.y = value
    })

    // ? OnRotation listener
    _socket.on("r", (rotation: number) => {
      _socket.wilder.r = rotation
    })

    // ? OnAttack listener
    _socket.on("a", (attacking: boolean) => {
      if (attacking) {
        socket.emit("a")

        const timer = setInterval(() => {
          // ! Broadcast this to other players as well
          socket.emit("a")
        }, 700)

        wilderAttackIntervalMap.set(socket.id, timer)
        return
      }

      clearInterval(wilderAttackIntervalMap.get(socket.id))
    })
  })
}

function handleEngineTick(io: Server) {
  const namespace = io.of("/")

  const sockets = Object.values(
    Object.fromEntries(namespace.sockets.entries()),
  ) as Array<ISocket>

  // ? Update wilder positions
  sockets.forEach(({ wilder }) => {
    const wilderBody = wilder.body
    const wilderSpeed = GamePhysicsConfig.wilderSpeed

    let _x = wilder.x * wilderSpeed
    let _y = wilder.y * wilderSpeed

    if (wilder.x !== 0 && wilder.y !== 0) {
      _x = (wilder.x * wilderSpeed) / Math.sqrt(2)
      _y = (wilder.y * wilderSpeed) / Math.sqrt(2)
    }

    Matter.Body.applyForce(
      wilderBody,
      { x: wilderBody.position.x, y: wilderBody.position.y },
      { x: _x, y: _y },
    )
  })

  // ? Emit room packets to the client side
  sockets.forEach(({ id, wilder }) => {
    const clientData = wilder.getClientData()
    io.to(id).emit("d", clientData)
  })
}

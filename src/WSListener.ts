import { Server } from "socket.io"

export function WSListener(io: Server) {
  io.on("connection", (socket) => {
    console.log(socket.id.green)

    // // Movement
    // socket.on("m", ([direction, value]: ["h" | "v", number]) => {
    //   if (direction === "h") {
    //     socket.wilder.x = value
    //     return
    //   }
    //   socket.wilder.y = value
    // })

    // // Rotation
    // socket.on("r", (rotation: number) => {
    //   socket.wilder.r = rotation
    // })

    // // Attacking
    // socket.on("a", (attacking: boolean) => {
    //   socket.wilder.a = attacking
    // })
  })
}

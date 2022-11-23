import "colors";

import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "cors";

import { Server as HTTPServer } from "http";
import { Server as WSServer } from "socket.io";
import { SocketListener } from "./game";
import { CorsConfig } from "./config";

dotenv.config();
const app = express();
app.use(morgan("common"));
app.use(cors(CorsConfig));

const server = new HTTPServer(app);
SocketListener(new WSServer(server, { cors: CorsConfig }));

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log("Server running on: http://localhost:8000");
});

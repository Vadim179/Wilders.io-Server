import "reflect-metadata";
import "tsconfig-paths/register";
import "colors";

import dotenv from "dotenv";
const isProduction = process.env.NODE_ENV === "production";

dotenv.config({
  path: isProduction ? ".env.production" : ".env.development",
});

import ws, { CustomWsServer } from "ws";
import { initializeGame } from "./game";

const wsServer = new ws.Server({ port: 8000 });
initializeGame(wsServer as CustomWsServer);

wsServer.on("listening", () => {
  console.log("Server running on: http://localhost:8000".green);
});

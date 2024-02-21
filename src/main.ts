import "colors";

import dotenv from "dotenv";
import express from "express";

import { Server as HTTPServer } from "http";
import { Server as WSServer } from "socket.io";
import { initializeGame } from "./game";
import { corsConfig } from "./config/corsConfig";

dotenv.config();
const app = express();

const server = new HTTPServer(app);
initializeGame(new WSServer(server, { cors: corsConfig }));

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log("Server running on: http://localhost:8000");
});

import "reflect-metadata";
import "tsconfig-paths/register";
import "colors";

import dotenv from "dotenv";

const isProduction = process.env.NODE_ENV === "production";

dotenv.config({
  path: isProduction ? ".env.production" : ".env.development",
});

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import http from "http";
import io from "socket.io";

import { initializeGame } from "./game";
import { corsConfig } from "./config/corsConfig";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan(isProduction ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const server = http.createServer(app);
initializeGame(
  new io.Server(server, {
    cors: corsConfig,
  }),
);

const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log("Server running on: http://localhost:8000".green);
});

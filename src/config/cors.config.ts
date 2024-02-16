import { CorsOptions } from "cors";

export const CorsConfig = Object.freeze({
  origin: "*",
  methods: ["GET", "POST"]
} as CorsOptions);

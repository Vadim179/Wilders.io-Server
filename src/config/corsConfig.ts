import { CorsOptions } from "cors";

export const corsConfig: CorsOptions = {
  origin: ["http://127.0.0.1:5501", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

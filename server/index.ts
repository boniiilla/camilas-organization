import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import authRouter from "./routes/auth";
import asignaturasRouter from "./routes/asignaturas";
import tareasRouter from "./routes/tareas";
import examenesRouter from "./routes/examenes";
import cosasRouter from "./routes/cosas";
import { requireAuth } from "./middleware/auth";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Public
  app.use("/api/auth", authRouter);

  // Protected
  app.use("/api/asignaturas", requireAuth, asignaturasRouter);
  app.use("/api/tareas", requireAuth, tareasRouter);
  app.use("/api/examenes", requireAuth, examenesRouter);
  app.use("/api/cosas", requireAuth, cosasRouter);

  return app;
}

import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import asignaturasRouter from "./routes/asignaturas";
import tareasRouter from "./routes/tareas";
import examenesRouter from "./routes/examenes";
import cosasRouter from "./routes/cosas";

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

  app.use("/api/asignaturas", asignaturasRouter);
  app.use("/api/tareas", tareasRouter);
  app.use("/api/examenes", examenesRouter);
  app.use("/api/cosas", cosasRouter);

  return app;
}

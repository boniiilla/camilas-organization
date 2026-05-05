import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import webpush from "web-push";
import { handleDemo } from "./routes/demo";
import authRouter from "./routes/auth";
import asignaturasRouter from "./routes/asignaturas";
import tareasRouter from "./routes/tareas";
import subtareasRouter from "./routes/subtareas";
import examenesRouter from "./routes/examenes";
import cosasRouter from "./routes/cosas";
import profileRouter from "./routes/profile";
import pushRouter from "./routes/push";
import remindersRouter from "./routes/reminders";
import manualRemindersRouter from "./routes/manual-reminders";
import { requireAuth } from "./middleware/auth";
import { prisma } from "./prisma";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

async function sendPush(subs: { endpoint: string; p256dh: string; auth: string }[], title: string, body: string) {
  const payload = JSON.stringify({ title, body });
  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );
}

async function dispatchReminders() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${hh}:${mm}`;
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  // Linked reminders (tareas / examenes)
  const reminders = await prisma.reminder.findMany({
    where: {
      remind_from: { lte: todayStr },
      remind_until: { gte: todayStr },
      remind_time: currentTime,
    },
    include: { user: { include: { push_subscriptions: true } } },
  });

  for (const reminder of reminders) {
    if (!reminder.user.push_subscriptions.length) continue;
    await sendPush(
      reminder.user.push_subscriptions,
      reminder.title,
      `Recordatorio: vence el ${reminder.due_date}`
    );
  }

  // Manual reminders with scheduled dates
  const manual = await prisma.manualReminder.findMany({
    where: {
      remind_from: { lte: todayStr },
      remind_until: { gte: todayStr },
      remind_time: currentTime,
    },
    include: { user: { include: { push_subscriptions: true } } },
  });

  for (const reminder of manual) {
    if (!reminder.user.push_subscriptions.length) continue;
    await sendPush(
      reminder.user.push_subscriptions,
      reminder.title,
      reminder.description ?? "Recordatorio programado"
    );
  }
}

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

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
  app.use("/api/tareas/:tareaId/subtareas", requireAuth, subtareasRouter);
  app.use("/api/examenes", requireAuth, examenesRouter);
  app.use("/api/cosas", requireAuth, cosasRouter);
  app.use("/api/profile", requireAuth, profileRouter);
  app.use("/api/push", requireAuth, pushRouter);
  app.use("/api/reminders", requireAuth, remindersRouter);
  app.use("/api/manual-reminders", requireAuth, manualRemindersRouter);

  // Cron: send push reminders every minute
  cron.schedule("* * * * *", () => dispatchReminders().catch((err) => console.error("[cron] dispatchReminders error:", err)));

  return app;
}

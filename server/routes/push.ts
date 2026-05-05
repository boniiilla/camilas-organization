import { Router } from 'express';
import webpush from 'web-push';
import { prisma } from '../prisma';

const router = Router();

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

router.get('/vapid-public-key', (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', async (req, res) => {
  const user = (req as any).user;
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Suscripcion invalida' });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { user_id: user.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { user_id: user.userId, p256dh: keys.p256dh, auth: keys.auth },
  });

  res.json({ ok: true });
});

router.post('/test', async (req, res) => {
  const user = (req as any).user;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { user_id: user.userId },
  });

  if (subscriptions.length === 0) {
    return res.status(400).json({ error: 'No hay suscripciones activas. Activa las notificaciones primero.' });
  }

  const payload = JSON.stringify({
    title: 'Notificacion de prueba',
    body: 'Las notificaciones funcionan correctamente en tu dispositivo.',
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length === subscriptions.length) {
    return res.status(500).json({ error: 'No se pudo enviar la notificacion' });
  }

  res.json({ ok: true, sent: results.length - failed.length });
});

router.post('/send', async (req, res) => {
  const user = (req as any).user;
  const { title, body } = req.body;
  if (!title) return res.status(400).json({ error: 'Titulo requerido' });

  const subscriptions = await prisma.pushSubscription.findMany({ where: { user_id: user.userId } });
  if (subscriptions.length === 0) {
    return res.status(400).json({ error: 'No hay suscripciones activas. Activa las notificaciones en Perfil primero.' });
  }

  const payload = JSON.stringify({ title, body: body || '' });
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
    )
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed === subscriptions.length) return res.status(500).json({ error: 'No se pudo enviar la notificacion' });
  res.json({ ok: true });
});

export default router;

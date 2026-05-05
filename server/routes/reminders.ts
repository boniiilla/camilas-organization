import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

router.get('/', async (req, res) => {
  const user = (req as any).user;
  const reminders = await prisma.reminder.findMany({
    where: { user_id: user.userId },
    orderBy: { due_date: 'asc' },
  });
  res.json(reminders);
});

router.post('/', async (req, res) => {
  const user = (req as any).user;
  const { reference_id, type, title, due_date, mode, remind_from, remind_until, remind_time } = req.body;

  if (!reference_id || !type || !title || !due_date || !mode) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const computedFrom = remind_from ?? null;
  const computedUntil = remind_until ?? due_date;
  const computedTime = remind_time ?? '09:00';

  const reminder = await prisma.reminder.upsert({
    where: { reference_id_type: { reference_id, type } },
    create: {
      user_id: user.userId,
      reference_id,
      type,
      title,
      due_date,
      mode,
      remind_from: computedFrom,
      remind_until: computedUntil,
      remind_time: computedTime,
    },
    update: {
      title,
      due_date,
      mode,
      remind_from: computedFrom,
      remind_until: computedUntil,
      remind_time: computedTime,
    },
  });

  res.json(reminder);
});

router.delete('/:id', async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  const reminder = await prisma.reminder.findUnique({ where: { id } });
  if (!reminder || reminder.user_id !== user.userId) {
    return res.status(404).json({ error: 'No encontrado' });
  }

  await prisma.reminder.delete({ where: { id } });
  res.status(204).send();
});

export default router;

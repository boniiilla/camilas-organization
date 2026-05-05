import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

router.get('/', async (req, res) => {
  const user = (req as any).user;
  const items = await prisma.manualReminder.findMany({
    where: { user_id: user.userId },
    orderBy: { created_at: 'desc' },
  });
  res.json(items);
});

router.post('/', async (req, res) => {
  const user = (req as any).user;
  const { title, description, remind_from, remind_until, remind_time } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'El titulo es requerido' });

  const item = await prisma.manualReminder.create({
    data: {
      user_id: user.userId,
      title: title.trim(),
      description: description?.trim() || null,
      remind_from: remind_from || null,
      remind_until: remind_until || null,
      remind_time: remind_time || '09:00',
    },
  });
  res.json(item);
});

router.delete('/:id', async (req, res) => {
  const user = (req as any).user;
  const item = await prisma.manualReminder.findUnique({ where: { id: req.params.id } });
  if (!item || item.user_id !== user.userId) return res.status(404).json({ error: 'No encontrado' });
  await prisma.manualReminder.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;

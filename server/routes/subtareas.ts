import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const { tareaId } = req.params;
  const subtareas = await prisma.subTarea.findMany({
    where: { tarea_id: tareaId },
    orderBy: { created_at: 'asc' },
  });
  res.json(subtareas);
});

router.post('/', async (req, res) => {
  const { tareaId } = req.params;
  const { titulo } = req.body;
  if (!titulo?.trim()) return res.status(400).json({ error: 'Titulo requerido' });
  const subtarea = await prisma.subTarea.create({
    data: { tarea_id: tareaId, titulo: titulo.trim() },
  });
  res.status(201).json(subtarea);
});

router.put('/:subId', async (req, res) => {
  const { subId } = req.params;
  const { hecha, titulo } = req.body;
  const subtarea = await prisma.subTarea.update({
    where: { id: subId },
    data: {
      ...(hecha !== undefined && { hecha }),
      ...(titulo !== undefined && { titulo }),
    },
  });
  res.json(subtarea);
});

router.delete('/:subId', async (req, res) => {
  const { subId } = req.params;
  await prisma.subTarea.delete({ where: { id: subId } });
  res.status(204).end();
});

export default router;

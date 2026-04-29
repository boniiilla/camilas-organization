import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const data = await prisma.tarea.findMany({ orderBy: { fecha: 'asc' } });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { asignatura_id, titulo, fecha, hecha } = req.body;
  const data = await prisma.tarea.create({ data: { asignatura_id, titulo, fecha, hecha: hecha ?? false } });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { asignatura_id, titulo, fecha, hecha } = req.body;
  const data = await prisma.tarea.update({
    where: { id: req.params.id },
    data: { asignatura_id, titulo, fecha, hecha },
  });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  await prisma.tarea.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;

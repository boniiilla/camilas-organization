import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const data = await prisma.cosaQuHacer.findMany({ orderBy: { fecha_creacion: 'desc' } });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { titulo, descripcion, completada, prioridad } = req.body;
  const data = await prisma.cosaQuHacer.create({ data: { titulo, descripcion, completada: completada ?? false, prioridad: prioridad ?? 'media' } });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { titulo, descripcion, completada, prioridad } = req.body;
  const data = await prisma.cosaQuHacer.update({
    where: { id: req.params.id },
    data: { titulo, descripcion, completada, prioridad },
  });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  await prisma.cosaQuHacer.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;

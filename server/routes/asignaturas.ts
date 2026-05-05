import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const data = await prisma.asignatura.findMany({ orderBy: { created_at: 'desc' } });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { nombre, color, profesor } = req.body;
  const data = await prisma.asignatura.create({ data: { nombre, color, profesor: profesor || null } });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { nombre, color, profesor } = req.body;
  const data = await prisma.asignatura.update({ where: { id: req.params.id }, data: { nombre, color, profesor: profesor || null } });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  await prisma.asignatura.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;

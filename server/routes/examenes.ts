import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const data = await prisma.examen.findMany({ orderBy: { fecha: 'asc' } });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { asignatura_id, titulo, fecha, nota, detalles, archivos } = req.body;
  const data = await prisma.examen.create({ data: { asignatura_id, titulo, fecha, nota, detalles, archivos } });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { asignatura_id, titulo, fecha, nota, detalles, archivos } = req.body;
  const data = await prisma.examen.update({
    where: { id: req.params.id },
    data: { asignatura_id, titulo, fecha, nota, detalles, archivos },
  });

  if (fecha) {
    await prisma.reminder.updateMany({
      where: { reference_id: req.params.id, type: 'examen' },
      data: { due_date: fecha, ...(titulo && { title: titulo }) },
    });
  }

  res.json(data);
});

router.delete('/:id', async (req, res) => {
  await prisma.examen.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;

import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const data = await prisma.tarea.findMany({ orderBy: { fecha: 'asc' } });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { asignatura_id, titulo, descripcion, fecha, hecha, archivos } = req.body;
  const data = await prisma.tarea.create({ data: { asignatura_id, titulo, descripcion: descripcion || null, fecha, hecha: hecha ?? false, archivos: archivos ?? undefined } });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { asignatura_id, titulo, descripcion, fecha, hecha, archivos } = req.body;

  if (hecha === true) {
    const pending = await prisma.subTarea.count({
      where: { tarea_id: req.params.id, hecha: false },
    });
    if (pending > 0) {
      return res.status(400).json({ error: `Tienes ${pending} subtarea${pending > 1 ? 's' : ''} pendiente${pending > 1 ? 's' : ''}. Completa todas las subtareas antes de marcar la tarea como hecha.` });
    }
  }

  const data = await prisma.tarea.update({
    where: { id: req.params.id },
    data: { asignatura_id, titulo, descripcion: descripcion !== undefined ? (descripcion || null) : undefined, fecha, hecha, ...(archivos !== undefined && { archivos }) },
  });

  if (fecha) {
    await prisma.reminder.updateMany({
      where: { reference_id: req.params.id, type: 'tarea' },
      data: { due_date: fecha, ...(titulo && { title: titulo }) },
    });
  }

  res.json(data);
});

router.delete('/:id', async (req, res) => {
  await prisma.tarea.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;

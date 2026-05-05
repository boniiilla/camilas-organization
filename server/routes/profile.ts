import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';

const router = Router();

router.get('/', async (req, res) => {
  const user = (req as any).user;
  const profile = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { id: true, username: true, email: true, avatar_url: true },
  });
  if (!profile) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(profile);
});

router.put('/', async (req, res) => {
  const user = (req as any).user;
  const { username, email, avatar_url } = req.body;

  if (username && username !== user.username) {
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists && exists.id !== user.userId) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
    }
  }

  if (email) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists && exists.id !== user.userId) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.userId },
    data: {
      ...(username && { username }),
      ...(email !== undefined && { email: email || null }),
      ...(avatar_url !== undefined && { avatar_url: avatar_url || null }),
    },
    select: { id: true, username: true, email: true, avatar_url: true },
  });

  res.json(updated);
});

router.put('/password', async (req, res) => {
  const user = (req as any).user;
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser) return res.status(404).json({ error: 'Usuario no encontrado' });

  const valid = await bcrypt.compare(current_password, dbUser.password);
  if (!valid) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

  const hashed = await bcrypt.hash(new_password, 10);
  await prisma.user.update({ where: { id: user.userId }, data: { password: hashed } });

  res.json({ ok: true });
});

export default router;

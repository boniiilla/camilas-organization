import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export async function seedInitialUser() {
  const username = process.env.USER_WEB;
  const password = process.env.PASSWORD_USER;
  if (!username || !password) return;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return;

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { username, password: hashed } });
  console.log(`✅ Usuario inicial creado: ${username}`);
}

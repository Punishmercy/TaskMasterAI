import express from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email } = req.body;

  // 1. Buscar usuario en la BD
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }

  // 2. Generar token JWT
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });

  // 3. Enviar token al cliente
  res.json({ token, userId: user.id });
});

export default router;

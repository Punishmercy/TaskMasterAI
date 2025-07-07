import express from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El campo email es obligatorio' });
  }

  // Buscar usuario por email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: {
      id: true,
      email: true,
      role: true,
    },
  });


  if (!user) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }

  // Generar token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  // Respuesta
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    },
  });
});

export default router;

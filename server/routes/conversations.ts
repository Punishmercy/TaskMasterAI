import express, { Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.post("/api/conversations", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.userId; // si tienes extendido el tipo de Request
  res.json({ message: `Conversación creada para el usuario ${userId}` });
});

export default router;

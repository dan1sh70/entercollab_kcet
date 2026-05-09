import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { callOpenAI } from '../services/ai.js';

const router = Router();

router.post('/chat/:roomId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) { res.status(422).json({ error: 'Message is required.' }); return; }

    const aiReq = await prisma.aIRequest.create({
      data: { userId: req.user!.id, chatRoomId: parseInt(req.params.roomId as string), type: 'chat', prompt: message, status: 'pending' },
    });

    try {
      const content = await callOpenAI([
        { role: 'system', content: 'You are EnterCollab AI, a helpful assistant for university collaboration projects.' },
        { role: 'user', content: message },
      ]);
      await prisma.aIResponse.create({ data: { aiRequestId: aiReq.id, content, modelUsed: 'minimaxai/minimax-m2.7' } });
      await prisma.aIRequest.update({ where: { id: aiReq.id }, data: { status: 'completed' } });
      res.json({ status: 'completed', response: content });
    } catch (err: any) {
      await prisma.aIRequest.update({ where: { id: aiReq.id }, data: { status: 'failed', errorMessage: err.message } });
      res.status(500).json({ error: err.message });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/summarize', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || text.length < 50) { res.status(422).json({ error: 'Text must be at least 50 characters.' }); return; }

    const aiReq = await prisma.aIRequest.create({
      data: { userId: req.user!.id, type: 'summary', prompt: text, status: 'pending' },
    });

    try {
      const content = await callOpenAI([
        { role: 'user', content: `Summarize the following text concisely:\n\n${text}` },
      ]);
      await prisma.aIResponse.create({ data: { aiRequestId: aiReq.id, content, modelUsed: 'minimaxai/minimax-m2.7' } });
      await prisma.aIRequest.update({ where: { id: aiReq.id }, data: { status: 'completed' } });
      res.json({ status: 'completed', response: content });
    } catch (err: any) {
      await prisma.aIRequest.update({ where: { id: aiReq.id }, data: { status: 'failed', errorMessage: err.message } });
      res.status(500).json({ error: err.message });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/status/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const aiReq = await prisma.aIRequest.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: { response: true },
    });
    if (!aiReq || aiReq.userId !== req.user!.id) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ status: aiReq.status, response: aiReq.response?.content || null });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

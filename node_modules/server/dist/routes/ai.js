import { Router } from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
async function callOpenAI(messages) {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    if (!apiKey || apiKey === 'your-openai-api-key') {
        const lastMsg = messages[messages.length - 1]?.content || '';
        return `[MOCK AI RESPONSE] Received: "${lastMsg}". Configure OPENAI_API_KEY for real responses.`;
    }
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, temperature: 0.7 }),
    });
    if (!res.ok)
        throw new Error('AI Service Unavailable');
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}
router.post('/chat/:roomId', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            res.status(422).json({ error: 'Message is required.' });
            return;
        }
        const aiReq = await prisma.aIRequest.create({
            data: { userId: req.user.id, chatRoomId: parseInt(req.params.roomId), type: 'chat', prompt: message, status: 'pending' },
        });
        try {
            const content = await callOpenAI([
                { role: 'system', content: 'You are InterCollab AI, a helpful assistant for university collaboration projects.' },
                { role: 'user', content: message },
            ]);
            await prisma.aIResponse.create({ data: { aiRequestId: aiReq.id, content, modelUsed: process.env.OPENAI_MODEL || 'gpt-4o' } });
            await prisma.aIRequest.update({ where: { id: aiReq.id }, data: { status: 'completed' } });
            res.json({ status: 'completed', response: content });
        }
        catch (err) {
            await prisma.aIRequest.update({ where: { id: aiReq.id }, data: { status: 'failed', errorMessage: err.message } });
            res.status(500).json({ error: err.message });
        }
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/summarize', authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.length < 50) {
            res.status(422).json({ error: 'Text must be at least 50 characters.' });
            return;
        }
        const aiReq = await prisma.aIRequest.create({
            data: { userId: req.user.id, type: 'summary', prompt: text, status: 'pending' },
        });
        try {
            const content = await callOpenAI([
                { role: 'user', content: `Summarize the following text concisely:\n\n${text}` },
            ]);
            await prisma.aIResponse.create({ data: { aiRequestId: aiReq.id, content, modelUsed: process.env.OPENAI_MODEL || 'gpt-4o' } });
            await prisma.aIRequest.update({ where: { id: aiReq.id }, data: { status: 'completed' } });
            res.json({ status: 'completed', response: content });
        }
        catch (err) {
            await prisma.aIRequest.update({ where: { id: aiReq.id }, data: { status: 'failed', errorMessage: err.message } });
            res.status(500).json({ error: err.message });
        }
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/status/:id', authMiddleware, async (req, res) => {
    try {
        const aiReq = await prisma.aIRequest.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { response: true },
        });
        if (!aiReq || aiReq.userId !== req.user.id) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.json({ status: aiReq.status, response: aiReq.response?.content || null });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;
//# sourceMappingURL=ai.js.map
import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { researchStorage } from '../config/cloudinary.js';

const upload = multer({ storage: researchStorage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { field, search, page = '1' } = req.query;
    const take = 12;
    const skip = (parseInt(page as string) - 1) * take;

    const where: any = { status: 'published' };
    if (field) where.field = field as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { abstract: { contains: search as string } },
        { authors: { contains: search as string } },
      ];
    }

    const [papers, total] = await Promise.all([
      prisma.researchPaper.findMany({
        where,
        include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.researchPaper.count({ where }),
    ]);

    res.json({ papers, total, page: parseInt(page as string), lastPage: Math.ceil(total / take) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, abstract, authors, field, doi, publication_date } = req.body;
    if (!title || !abstract || !authors || !field) {
      res.status(422).json({ error: 'Title, abstract, authors, and field are required.' });
      return;
    }

    const data: any = {
      userId: req.user!.id, title, abstract, authors, field, status: 'published',
    };
    if (doi) data.doi = doi;
    if (publication_date) data.publicationDate = new Date(publication_date);
    if (req.file) data.filePath = req.file.path;

    const paper = await prisma.researchPaper.create({ data });
    res.json({ success: true, paper });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const paper = await prisma.researchPaper.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
    });
    if (!paper) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ paper });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const paper = await prisma.researchPaper.findUnique({ where: { id: parseInt(req.params.id as string) } });
    if (!paper || paper.userId !== req.user!.id) { res.status(403).json({ error: 'Unauthorized' }); return; }

    const { title, abstract, authors, field, doi, publication_date, status } = req.body;
    const data: any = {};
    if (title) data.title = title;
    if (abstract) data.abstract = abstract;
    if (authors) data.authors = authors;
    if (field) data.field = field;
    if (doi !== undefined) data.doi = doi;
    if (publication_date) data.publicationDate = new Date(publication_date);
    if (status) data.status = status;
    if (req.file) data.filePath = req.file.path;

    const updated = await prisma.researchPaper.update({ where: { id: paper.id }, data });
    res.json({ success: true, paper: updated });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const paper = await prisma.researchPaper.findUnique({ where: { id: parseInt(req.params.id as string) } });
    if (!paper || paper.userId !== req.user!.id) { res.status(403).json({ error: 'Unauthorized' }); return; }
    await prisma.researchPaper.delete({ where: { id: paper.id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

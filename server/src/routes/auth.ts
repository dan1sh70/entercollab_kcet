import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { createVerificationCode, verifyCode } from '../services/verification.js';
import { sendVerificationEmail } from '../services/email.js';

import { profileStorage } from '../config/cloudinary.js';

const upload = multer({ storage: profileStorage, limits: { fileSize: 2 * 1024 * 1024 } });

const router = Router();

function makeToken(userId: number) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
}

function sanitizeUser(user: any) {
  return {
    id: user.id, name: user.name, email: user.email,
    accountType: user.accountType, profilePhotoPath: user.profilePhotoPath,
    university: user.university, major: user.major,
    isAdmin: !!user.isAdmin, managedCollegeId: user.managedCollegeId,
    bio: user.bio, skills: user.skills,
  };
}

// Step 1 — send verification code to email
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(422).json({ error: 'Email is required.' }); return; }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { res.status(422).json({ error: 'This email is already registered. Try signing in.' }); return; }

    const code = createVerificationCode(email);
    await sendVerificationEmail(email, code);

    res.json({ success: true, message: 'Verification code sent.' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Step 2 — verify code + create account
router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { email, code, password, name, accountType, institution_kind } = req.body;

    if (!email || !code || !password) {
      res.status(422).json({ error: 'Email, code, and password are required.' });
      return;
    }
    if (password.length < 8) {
      res.status(422).json({ error: 'Password must be at least 8 characters.' });
      return;
    }

    const valid = verifyCode(email, code);
    if (!valid) {
      res.status(422).json({ error: 'Invalid or expired verification code.' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { res.status(422).json({ error: 'Email already registered.' }); return; }

    const hashed = await bcrypt.hash(password, 12);
    const isInstitution = accountType === 'institution';

    let managedCollegeId: number | undefined;
    if (isInstitution && name) {
      let college = await prisma.college.findFirst({ where: { name } });
      if (!college) {
        college = await prisma.college.create({
          data: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), isVerified: 1 },
        });
      }
      managedCollegeId = college.id;
    }

    const user = await prisma.user.create({
      data: {
        name: name || email.split('@')[0],
        email,
        password: hashed,
        accountType: isInstitution ? 'institution' : 'student',
        emailVerifiedAt: new Date(),
        ...(isInstitution && { institutionKind: institution_kind, managedCollegeId }),
      },
    });

    const token = makeToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Step 3 — complete profile (authenticated)
router.patch('/complete-profile', authMiddleware, upload.single('profile_photo'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, bio, university, major, skills, institution_kind, website, description } = req.body;
    const data: any = {};
    if (name) data.name = name;
    if (bio !== undefined) data.bio = bio;
    if (university !== undefined) data.university = university;
    if (major !== undefined) data.major = major;
    if (skills !== undefined) data.skills = skills;
    if (institution_kind) data.institutionKind = institution_kind;
    if (website !== undefined) data.website = website;
    if (req.file) data.profilePhotoPath = req.file.path;

    if (description && req.user!.managedCollegeId) {
      await prisma.college.update({
        where: { id: req.user!.managedCollegeId },
        data: { description, website: website || undefined },
      });
    }

    const user = await prisma.user.update({ where: { id: req.user!.id }, data });
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Legacy endpoints (kept for compatibility)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) { res.status(422).json({ error: 'Name, email and password are required.' }); return; }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { res.status(422).json({ error: 'Email already registered.' }); return; }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, password: hashed, accountType: 'student' } });
    const token = makeToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/register-institution', async (req: Request, res: Response) => {
  try {
    const { name, email, password, institution_kind } = req.body;
    if (!name || !email || !password || !institution_kind) { res.status(422).json({ error: 'All fields are required.' }); return; }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { res.status(422).json({ error: 'Email already registered.' }); return; }
    let college = await prisma.college.findFirst({ where: { name } });
    if (!college) { college = await prisma.college.create({ data: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), isVerified: 1 } }); }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, password: hashed, accountType: 'institution', institutionKind: institution_kind, managedCollegeId: college.id } });
    const token = makeToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(422).json({ error: 'Email and password are required.' }); return; }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { res.status(401).json({ error: 'Invalid credentials.' }); return; }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { res.status(401).json({ error: 'Invalid credentials.' }); return; }
    const token = makeToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/logout', authMiddleware, (_req: AuthRequest, res: Response) => {
  res.json({ success: true });
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, bio: true, university: true, major: true,
        profilePhotoPath: true, isAdmin: true, accountType: true, managedCollegeId: true,
        skills: true, nationality: true, location: true, website: true, githubHandle: true,
        linkedinHandle: true, twitterHandle: true,
      },
    });
    res.json({ user: dbUser ? { ...dbUser, isAdmin: !!dbUser.isAdmin } : null });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    isAdmin: boolean;
    accountType: string;
    profilePhotoPath: string | null;
    university: string | null;
    major: string | null;
    managedCollegeId: number | null;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: number | string };
    const userId = typeof decoded.userId === 'number' ? decoded.userId : Number(decoded.userId);
    if (!Number.isFinite(userId)) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    prisma.user
      .findUnique({ where: { id: userId } })
      .then((user) => {
        if (!user) {
          res.status(401).json({ error: 'User not found' });
          return;
        }
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: !!user.isAdmin,
          accountType: user.accountType,
          profilePhotoPath: user.profilePhotoPath,
          university: user.university,
          major: user.major,
          managedCollegeId: user.managedCollegeId,
        };
        next();
      })
      .catch(() => {
        res.status(401).json({ error: 'Invalid token' });
      });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: number | string };
    const userId = typeof decoded.userId === 'number' ? decoded.userId : Number(decoded.userId);
    if (!Number.isFinite(userId)) {
      next();
      return;
    }
    prisma.user
      .findUnique({ where: { id: userId } })
      .then((user) => {
        if (user) {
          req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: !!user.isAdmin,
            accountType: user.accountType,
            profilePhotoPath: user.profilePhotoPath,
            university: user.university,
            major: user.major,
            managedCollegeId: user.managedCollegeId,
          };
        }
        next();
      })
      .catch(() => next());
  } catch {
    next();
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ error: 'Unauthorized action.' });
    return;
  }
  next();
}

export function institutionMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.accountType !== 'institution') {
    res.status(403).json({ error: 'This area is for verified organization accounts.' });
    return;
  }
  next();
}

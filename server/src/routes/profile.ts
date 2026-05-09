import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { profileStorage } from '../config/cloudinary.js';

const upload = multer({ storage: profileStorage, limits: { fileSize: 2 * 1024 * 1024 } });

const router = Router();

router.get('/edit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, bio: true, university: true, major: true,
        profilePhotoPath: true, skills: true, nationality: true, location: true,
        website: true, githubHandle: true, linkedinHandle: true, twitterHandle: true,
      },
    });
    res.json({ user });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/', authMiddleware, upload.single('profile_photo'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, bio, university, major, nationality, location, skills, github_handle, linkedin_handle, twitter_handle, website } = req.body;

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (bio !== undefined) data.bio = bio;
    if (university !== undefined) data.university = university;
    if (major !== undefined) data.major = major;
    if (nationality !== undefined) data.nationality = nationality;
    if (location !== undefined) data.location = location;
    if (skills !== undefined) data.skills = skills;
    if (github_handle !== undefined) data.githubHandle = github_handle;
    if (linkedin_handle !== undefined) data.linkedinHandle = linkedin_handle;
    if (twitter_handle !== undefined) data.twitterHandle = twitter_handle;
    if (website !== undefined) data.website = website;

    if (password) {
      data.password = await bcrypt.hash(password, 12);
    }

    if (req.file) {
      data.profilePhotoPath = req.file.path;
    }

    const user = await prisma.user.update({ where: { id: req.user!.id }, data });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, profilePhotoPath: user.profilePhotoPath } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.user!.id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id/followers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string);
    const viewerId = req.user!.id;
    const followers = await prisma.userFollow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: 'desc' },
      include: { follower: { select: { id: true, name: true, profilePhotoPath: true, university: true, major: true } } },
      take: 200,
    });

    const viewerFollowing = await prisma.userFollow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });
    const viewerFollowingSet = new Set(viewerFollowing.map((f) => f.followingId));

    res.json({
      followers: followers.map((f) => ({
        user: f.follower,
        followedAt: f.createdAt,
        isFollowing: viewerFollowingSet.has(f.follower.id),
      })),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id/following', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string);
    const viewerId = req.user!.id;
    const following = await prisma.userFollow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { following: { select: { id: true, name: true, profilePhotoPath: true, university: true, major: true } } },
      take: 200,
    });

    const viewerFollowing = await prisma.userFollow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });
    const viewerFollowingSet = new Set(viewerFollowing.map((f) => f.followingId));

    res.json({
      following: following.map((f) => ({
        user: f.following,
        followedAt: f.createdAt,
        isFollowing: viewerFollowingSet.has(f.following.id),
      })),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string);
    const viewerId = req.user!.id;
    const isOwn = viewerId === userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, bio: true, university: true, major: true,
        profilePhotoPath: true, skills: true, nationality: true, location: true,
        website: true, githubHandle: true, linkedinHandle: true, twitterHandle: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const researchWhere = isOwn
      ? { userId }
      : { userId, status: { not: 'draft' } };

    const [
      projects,
      followersCount,
      followingCount,
      projectsCount,
      isFollowing,
      researchPapers,
      collabRequests,
      researchTotalCount,
      collabsTotalCount,
    ] = await Promise.all([
      prisma.post.findMany({
        where: { userId, type: 'project', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { likes: true, comments: true },
      }),
      prisma.userFollow.count({ where: { followingId: userId } }),
      prisma.userFollow.count({ where: { followerId: userId } }),
      prisma.post.count({ where: { userId, type: 'project', deletedAt: null } }),
      prisma.userFollow.findFirst({ where: { followerId: viewerId, followingId: userId } }),
      prisma.researchPaper.findMany({
        where: researchWhere,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.projectRequest.findMany({
        where: { userId, approved: 1 },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          post: {
            include: {
              user: { select: { id: true, name: true, profilePhotoPath: true } },
              likes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.researchPaper.count({ where: researchWhere }),
      prisma.projectRequest.count({
        where: {
          userId,
          approved: 1,
          post: { deletedAt: null, type: 'project' },
        },
      }),
    ]);

    const safeUser = isOwn ? user : { ...user, email: undefined };

    res.json({
      user: safeUser,
      projects: projects.map((p) => ({ ...p, likes_count: p.likes.length, comments_count: p.comments.length })),
      researchPapers,
      collabs: collabRequests
        .filter((r) => r.post && r.post.deletedAt == null && r.post.type === 'project')
        .map((r) => ({
          id: r.id,
          joinedAt: r.createdAt,
          post: {
            ...r.post,
            likes_count: r.post.likes.length,
            comments_count: r.post.comments.length,
          },
        })),
      followersCount,
      followingCount,
      projectsCount,
      researchCount: researchTotalCount,
      collabsCount: collabsTotalCount,
      isFollowing: !!isFollowing,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

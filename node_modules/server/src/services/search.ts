import prisma from '../config/database.js';

interface SearchFilters {
  type?: string;
  category?: string;
}

export async function search(query: string, filters: SearchFilters = {}) {
  const results: { projects: any[]; users: any[]; colleges: any[] } = {
    projects: [],
    users: [],
    colleges: [],
  };

  const type = filters.type || 'all';

  if (type === 'all' || type === 'projects') {
    const where: any = {
      type: 'project',
      status: 'published',
      deletedAt: null,
      OR: [
        { title: { contains: query } },
        { content: { contains: query } },
        { tags: { contains: query } },
      ],
    };
    if (filters.category) where.category = filters.category;

    results.projects = await prisma.post.findMany({
      where,
      include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
      take: 10,
    });
  }

  if (type === 'all' || type === 'users') {
    results.users = await prisma.user.findMany({
      where: { OR: [{ name: { contains: query } }, { email: { contains: query } }] },
      select: { id: true, name: true, email: true, profilePhotoPath: true, university: true },
      take: 10,
    });
  }

  if (type === 'all' || type === 'colleges') {
    results.colleges = await prisma.college.findMany({
      where: { name: { contains: query } },
      take: 5,
    });
  }

  return results;
}

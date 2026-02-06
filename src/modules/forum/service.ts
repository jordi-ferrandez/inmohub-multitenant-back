import { prisma } from "@core/lib";

export const forumService = {
  // Categories
  getCategories: async () => {
    return await prisma.forumCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { topics: true },
        },
      },
    });
  },

  createCategory: async (data: { title: string; description?: string; icon?: string; color?: string; order?: number }) => {
    return await prisma.forumCategory.create({
      data,
    });
  },

  // Topics
  getTopics: async (categoryId?: number, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const where = categoryId ? { categoryId, deletedAt: null } : { deletedAt: null };

    const [topics, total] = await Promise.all([
      prisma.forumTopic.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          _count: {
            select: { posts: true },
          },
          tags: true,
        },
      }),
      prisma.forumTopic.count({ where }),
    ]);

    return { topics, total, pages: Math.ceil(total / limit) };
  },

  getTopicById: async (id: number) => {
    // Increase views
    await prisma.forumTopic.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return await prisma.forumTopic.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        category: true,
        tags: true,
        posts: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  },

  createTopic: async (data: { title: string; content: string; categoryId: number; authorId: number; tags?: string[] }) => {
    const { tags, ...topicData } = data;
    
    return await prisma.forumTopic.create({
      data: {
        ...topicData,
        tags: tags ? {
          connectOrCreate: tags.map(tag => ({
            where: { name: tag },
            create: { name: tag }
          }))
        } : undefined
      },
    });
  },

  // Posts (Replies)
  createPost: async (data: { topicId: number; authorId: number; content: string }) => {
    const topic = await prisma.forumTopic.findUnique({ where: { id: data.topicId } });
    if (topic?.isLocked) {
      throw new Error("Este tema está cerrado y no permite más respuestas.");
    }

    return await prisma.forumPost.create({
      data,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });
  },

  // Moderation
  lockTopic: async (id: number, isLocked: boolean) => {
    return await prisma.forumTopic.update({
      where: { id },
      data: { isLocked },
    });
  },

  pinTopic: async (id: number, isPinned: boolean) => {
    return await prisma.forumTopic.update({
      where: { id },
      data: { isPinned },
    });
  },

  deleteTopic: async (id: number) => {
    return await prisma.forumTopic.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  deletePost: async (id: number) => {
    return await prisma.forumPost.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};

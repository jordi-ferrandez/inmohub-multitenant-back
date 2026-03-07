import { prisma } from "@core/lib";

// Lista predefinida de categorías (ahora son strings simples)
export const FORUM_CATEGORIES = [
  "Captación y Mercado",
  "Marketing Inmobiliario",
  "Legal y Fiscalidad",
  "Tecnología e IA",
  "Cafetería (Off-topic)",
];

export const forumService = {
  // Categorías: ahora son strings estáticos
  getCategories: async () => {
    // Devolvemos las categorías predefinidas junto con el conteo de topics de cada una
    const counts = await prisma.forumTopic.groupBy({
      by: ["category"],
      where: { deletedAt: null },
      _count: { id: true },
    });

    return FORUM_CATEGORIES.map((cat) => {
      const found = counts.find((c) => c.category === cat);
      return {
        name: cat,
        topicCount: found?._count?.id ?? 0,
      };
    });
  },

  // Topics
  getTopics: async (category?: string, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const where = category
      ? { category, deletedAt: null }
      : { deletedAt: null };

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

  createTopic: async (data: { title: string; content: string; category: string; authorId: number; tags?: string[] }) => {
    const { tags, ...topicData } = data;

    return await prisma.forumTopic.create({
      data: {
        ...topicData,
        tags: tags
          ? {
              connectOrCreate: tags.map((tag) => ({
                where: { name: tag },
                create: { name: tag },
              })),
            }
          : undefined,
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

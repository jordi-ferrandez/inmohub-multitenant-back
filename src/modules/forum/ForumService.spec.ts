import { forumService } from './service';

jest.mock('@core/lib', () => ({
  prisma: {
    forumTopic: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    forumPost: {
      create: jest.fn(),
    },
  },
}));

const prismaMock = jest.requireMock('@core/lib').prisma;

describe('forumService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should return categories with topic counts', async () => {
      prismaMock.forumTopic.groupBy.mockResolvedValue([
        { category: 'Captación y Mercado', _count: { id: 5 } },
      ]);

      const result = await forumService.getCategories();
      expect(result).toHaveLength(5);
      expect(result[0].name).toBe('Captación y Mercado');
      expect(result[0].topicCount).toBe(5);
    });
  });

  describe('getTopics', () => {
    it('should return paginated topics', async () => {
      prismaMock.forumTopic.findMany.mockResolvedValue([
        { id: 1, title: 'Test', author: {}, tags: [], _count: { posts: 2 } },
      ]);
      prismaMock.forumTopic.count.mockResolvedValue(1);

      const result = await forumService.getTopics(undefined, 1, 20);
      expect(result.topics).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('createPost', () => {
    it('should throw error if topic is locked', async () => {
      prismaMock.forumTopic.findUnique.mockResolvedValue({ isLocked: true });

      await expect(forumService.createPost({ topicId: 1, authorId: 1, content: 'test' }))
        .rejects.toThrow('Este tema está cerrado');
    });
  });
});

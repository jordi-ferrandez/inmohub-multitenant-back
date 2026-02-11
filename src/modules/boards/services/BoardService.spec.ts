import { BoardService } from './BoardService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

describe('BoardService', () => {
  let boardService: BoardService;
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
    boardService = new BoardService();
  });

  describe('getAllBoards', () => {
    it('should filter boards for non-director users', async () => {
      prismaMock.board.findMany.mockResolvedValue([]);
      
      await boardService.getAllBoards(1, ['Agent']);
      
      expect(prismaMock.board.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { ownerId: 1 }
      }));
    });

    it('should allow directors to see all boards or filter by owner', async () => {
      prismaMock.board.findMany.mockResolvedValue([]);
      
      await boardService.getAllBoards(1, ['Director'], { ownerId: 10 });
      
      expect(prismaMock.board.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { ownerId: 10 }
      }));
    });
  });

  describe('createBoard', () => {
    it('should create a board with default columns', async () => {
      const input = {
        title: 'New Board',
        ownerId: 1,
        creatorId: 1
      };

      prismaMock.board.create.mockResolvedValue({ id: 1, ...input } as any);

      const result = await boardService.createBoard(input);

      expect(result.id).toBe(1);
      expect(prismaMock.board.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          columns: {
            create: expect.any(Array)
          }
        })
      }));
    });
  });

  describe('moveCard', () => {
    it('should update columnId and create activity', async () => {
      prismaMock.boardCard.findUnique.mockResolvedValue({ id: 100, columnId: 1 } as any);
      prismaMock.boardCard.update.mockResolvedValue({ id: 100, columnId: 2 } as any);
      prismaMock.cardActivity.create.mockResolvedValue({} as any);

      const result = await boardService.moveCard(100, 2, 1);

      expect(result.columnId).toBe(2);
      expect(prismaMock.boardCard.update).toHaveBeenCalled();
      expect(prismaMock.cardActivity.create).toHaveBeenCalled();
    });

    it('should throw error if card not found', async () => {
      prismaMock.boardCard.findUnique.mockResolvedValue(null);

      await expect(boardService.moveCard(999, 2, 1)).rejects.toThrow('Card not found');
    });
  });
});

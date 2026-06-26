import { PublicApiService } from './PublicApiService';

describe('PublicApiService', () => {
  let service: PublicApiService;

  const mockDelegate = {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PublicApiService();
  });

  describe('findMany', () => {
    it('should return paginated results', async () => {
      mockDelegate.findMany.mockResolvedValue([{ id: 1, name: 'Test' }]);
      mockDelegate.count.mockResolvedValue(1);

      const result = await service.findMany(
        mockDelegate,
        { companyId: 1 },
        { page: 1, limit: 10 }
      );

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should enforce companyId filter when provided', async () => {
      mockDelegate.findMany.mockResolvedValue([]);
      mockDelegate.count.mockResolvedValue(0);

      await service.findMany(
        mockDelegate,
        { companyId: 5 },
        { page: 1, limit: 10 }
      );

      expect(mockDelegate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 5,
            deletedAt: null,
          }),
        })
      );
    });

    it('should enforce user filter when no companyId', async () => {
      mockDelegate.findMany.mockResolvedValue([]);
      mockDelegate.count.mockResolvedValue(0);

      await service.findMany(
        mockDelegate,
        { userId: 10 },
        { page: 1, limit: 10 }
      );

      expect(mockDelegate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            OR: expect.arrayContaining([
              expect.objectContaining({ capturedById: 10 }),
              expect.objectContaining({ userId: 10 }),
              expect.objectContaining({ authorId: 10 }),
            ]),
          }),
        })
      );
    });

    it('should respect custom filters', async () => {
      mockDelegate.findMany.mockResolvedValue([]);
      mockDelegate.count.mockResolvedValue(0);

      await service.findMany(
        mockDelegate,
        { companyId: 1 },
        { page: 1, limit: 10, status: 'active', type: 'sale' }
      );

      expect(mockDelegate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 1,
            status: 'active',
            type: 'sale',
          }),
        })
      );
    });

    it('should clamp limit to max 100', async () => {
      mockDelegate.findMany.mockResolvedValue([]);
      mockDelegate.count.mockResolvedValue(0);

      await service.findMany(
        mockDelegate,
        { companyId: 1 },
        { page: 1, limit: 500 }
      );

      expect(mockDelegate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a record by ID with company filter', async () => {
      const mockRecord = { id: 1, companyId: 1, name: 'Test' };
      mockDelegate.findFirst.mockResolvedValue(mockRecord);

      const result = await service.findOne(mockDelegate, 1, { companyId: 1 });

      expect(result.id).toBe(1);
      expect(mockDelegate.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, deletedAt: null, companyId: 1 },
        })
      );
    });

    it('should throw error when record not found', async () => {
      mockDelegate.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockDelegate, 999, { companyId: 1 })
      ).rejects.toThrow('Record not found');
    });
  });
});

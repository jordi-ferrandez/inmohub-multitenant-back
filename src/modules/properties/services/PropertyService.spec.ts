import { PropertyService } from './PropertyService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from './../../../generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

describe('PropertyService', () => {
  let propertyService: PropertyService;
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
    propertyService = new PropertyService();
  });

  describe('getPropertyById', () => {
    it('should return a property if it exists', async () => {
      const mockProperty = { id: 1, inmovillaCode: 'P123', number: '1A' };
      prismaMock.property.findFirst.mockResolvedValue(mockProperty as any);

      const result = await propertyService.getPropertyById(1, null);

      expect(result).toEqual(mockProperty);
      expect(prismaMock.property.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
        include: (propertyService as any).propertyRelations,
      });
    });

    it('should throw error if property does not exist', async () => {
      prismaMock.property.findFirst.mockResolvedValue(null);

      await expect(propertyService.getPropertyById(999, null)).rejects.toThrow(
        'No existe una property con ese id'
      );
    });
  });

  describe('getProperty', () => {
    it('should return paginated properties', async () => {
      const mockProperties = [{ id: 1 }, { id: 2 }];
      const mockTotal = 2;

      prismaMock.$transaction.mockResolvedValue([mockProperties, mockTotal]);

      const result = await propertyService.getProperty({ page: 1, limit: 10 }, null);

      expect(result.data).toEqual(mockProperties);
      expect(result.meta.totalItems).toBe(mockTotal);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});

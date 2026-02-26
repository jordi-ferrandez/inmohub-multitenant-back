import { BuildingService } from './BuildingService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from './../../../generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

describe('BuildingService', () => {
  let buildingService: BuildingService;
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
    buildingService = new BuildingService();
  });

  describe('getBuildings', () => {
    it('should return paginated buildings', async () => {
      const mockBuildings = [
        { id: 1, street: 'Calle Falsa', number: 123, properties: [] },
      ];
      const mockTotal = 1;

      prismaMock.$transaction.mockResolvedValue([mockBuildings, mockTotal]);

      const result = await buildingService.getBuildings({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockBuildings);
      expect(result.meta.totalItems).toBe(mockTotal);
    });
  });

  describe('getBuildingById', () => {
    it('should return building by id', async () => {
      const mockBuilding = {
        id: 1,
        street: 'Calle Falsa',
        number: 123,
        properties: [],
        assignments: []
      };

      prismaMock.building.findUnique.mockResolvedValue(mockBuilding as any);
      prismaMock.$transaction.mockResolvedValue([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

      const result = await buildingService.getBuildingById({ id: 1 });

      expect(result.building.id).toBe(1);
    });
  });
});

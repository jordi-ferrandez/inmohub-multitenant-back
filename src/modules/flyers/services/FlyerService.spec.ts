import { FlyerService } from './FlyerService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from './../../../generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

describe('FlyerService', () => {
  let flyerService: FlyerService;
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
    flyerService = new FlyerService();
  });

  describe('createFlyer', () => {
    it('should create a flyer record', async () => {
      const data = {
        propertyId: 1,
        templateId: 10,
        userId: 1,
        frontUrl: 'http://front',
        backUrl: 'http://back'
      };

      prismaMock.flyer.create.mockResolvedValue({ id: 100, ...data } as any);

      const result = await flyerService.createFlyer(data as any);

      expect(result.id).toBe(100);
      expect(prismaMock.flyer.create).toHaveBeenCalledWith(expect.objectContaining({
        data
      }));
    });
  });

  describe('recordShipment', () => {
    it('should record a flyer shipment', async () => {
      const shipment = { flyerId: 100, userId: 1, notes: 'Test' };
      prismaMock.flyerShipment.create.mockResolvedValue({ id: 500, ...shipment } as any);

      const result = await flyerService.recordShipment(100, 1, 'Test');

      expect(result.id).toBe(500);
      expect(prismaMock.flyerShipment.create).toHaveBeenCalled();
    });
  });
});

import { valuationService } from './ValuationService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from './../../../generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

describe('ValuationService', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('getWidgetConfig', () => {
    it('should return config if active', async () => {
      prismaMock.valuationWidgetConfig.findUnique.mockResolvedValue({
        id: 1,
        slug: 'test',
        isActive: true,
        user: {}
      } as any);

      const result = await valuationService.getWidgetConfig('test');
      expect(result.slug).toBe('test');
    });

    it('should throw error if widget deactivated', async () => {
      prismaMock.valuationWidgetConfig.findUnique.mockResolvedValue({
        id: 1,
        slug: 'test',
        isActive: false
      } as any);

      await expect(valuationService.getWidgetConfig('test'))
        .rejects.toThrow('Este widget de valoración está desactivado');
    });
  });

  describe('processValuation', () => {
    it('should calculate price and record request', async () => {
      const data = {
        slug: 'test',
        property: {
          address: 'Calle Falsa 123',
          builtM2: 100,
          type: 'piso',
          state: 'buen_estado'
        },
        contact: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      };

      prismaMock.valuationWidgetConfig.findUnique.mockResolvedValue({
        id: 1,
        slug: 'test',
        isActive: true,
        userId: 10
      } as any);

      prismaMock.valuationRequest.create.mockResolvedValue({ id: 1 } as any);
      prismaMock.person.findFirst.mockResolvedValue(null);
      prismaMock.person.create.mockResolvedValue({ id: 50, firstName: 'John' } as any);
      prismaMock.building.findFirst.mockResolvedValue(null);
      prismaMock.building.create.mockResolvedValue({ id: 20 } as any);
      prismaMock.property.findFirst.mockResolvedValue(null);
      prismaMock.property.create.mockResolvedValue({ id: 30 } as any);

      const result = await valuationService.processValuation(data as any);

      expect(result.estimatedPrice).toBeGreaterThan(0);
      expect(prismaMock.valuationRequest.create).toHaveBeenCalled();
      expect(prismaMock.person.create).toHaveBeenCalled();
    });
  });
});

import { agentService } from './AgentService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from './../../../generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

describe('AgentService', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('getActiveAssignments', () => {
    it('should return active assignments for a user', async () => {
      const mockAssignments = [
        {
          id: 1,
          userId: 10,
          buildingId: 5,
          type: 'Following',
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          building: {
            id: 5,
            street: 'Main St',
            number: 10,
            properties: [
              { id: 100, number: '1A', floor: '1', _count: { followUps: 2 } }
            ]
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      prismaMock.assignment.findMany.mockResolvedValue(mockAssignments as any);

      const result = await agentService.getActiveAssignments(10);

      expect(result).toHaveLength(1);
      expect(result[0].building.street).toBe('Main St');
      expect(prismaMock.assignment.findMany).toHaveBeenCalled();
    });
  });

  describe('getAvailableProperties', () => {
    it('should return paginated available properties', async () => {
      const mockProperties = [
        {
          id: 1,
          number: '1A',
          floor: '1',
          building: { id: 5, street: 'Main St', number: 10 },
          _count: { followUps: 0 }
        }
      ];

      prismaMock.property.findMany.mockResolvedValue(mockProperties as any);
      prismaMock.property.count.mockResolvedValue(1);

      const result = await agentService.getAvailableProperties(10, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter properties by search query', async () => {
      prismaMock.property.findMany.mockResolvedValue([]);
      prismaMock.property.count.mockResolvedValue(0);

      await agentService.getAvailableProperties(10, { search: 'Main 10' });

      expect(prismaMock.property.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          building: expect.objectContaining({
            street: expect.objectContaining({ contains: 'Main' }),
            number: expect.objectContaining({ equals: 10 })
          })
        })
      }));
    });
  });

  describe('getPropertyFollowUpsHistory', () => {
    it('should return property with follow-up history', async () => {
      const mockProperty = {
        id: 100,
        number: '1A',
        floor: '1',
        building: { id: 5, street: 'Main St', number: 10 },
        followUps: [
          {
            id: 1,
            wasContacted: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            seller: { firstName: 'Agent' }
          }
        ]
      };

      prismaMock.property.findUnique.mockResolvedValue(mockProperty as any);

      const result = await agentService.getPropertyFollowUpsHistory(100, 10);

      expect(result.id).toBe(100);
      expect(result.followUps).toHaveLength(1);
    });

    it('should throw error if property not found', async () => {
      prismaMock.property.findUnique.mockResolvedValue(null);

      await expect(agentService.getPropertyFollowUpsHistory(999, 10))
        .rejects.toThrow('Propiedad no encontrada');
    });
  });
});

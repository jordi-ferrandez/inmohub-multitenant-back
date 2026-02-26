import activityService from './ActivityService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

describe('ActivityService', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('getActivityReport', () => {
    it('should generate a report with aggregated follow-ups and mailboxings', async () => {
      // Use local dates to avoid timezone shifts in buckets
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const dateStr = today.toISOString().split('T')[0];
      
      const query = {
        startDate: dateStr,
        endDate: dateStr,
      };

      // Create a Date that will definitely fall into the bucket for 'dateStr'
      // The bucket dateStart is new Date(dateStr) followed by setHours(0,0,0,0) local.
      const bucketDate = new Date(dateStr);
      bucketDate.setHours(12, 0, 0, 0);

      prismaMock.followUp.findMany.mockResolvedValue([
        {
          createdAt: bucketDate,
          wasContacted: true,
          contactType: 'DIRECT',
          property: { id: 100 }
        }
      ] as any);

      prismaMock.mailboxing.findMany.mockResolvedValue([
        {
          date: bucketDate,
          status: 'inside'
        }
      ] as any);

      const result = await activityService.getActivityReport(query as any);

      expect(result.contactActivities).toHaveLength(1);
      expect(result.contactActivities[0].contacted).toBe(1);
      expect(result.mailboxingActivities[0].inside).toBe(1);
    });
  });

  describe('getActivityItems', () => {
    it('should return paginated activity items', async () => {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      const query = {
        startDate: dateStr,
        endDate: dateStr,
        page: 1,
        limit: 10
      };

      prismaMock.followUp.findMany.mockResolvedValue([
        {
          id: 1,
          createdAt: today,
          wasContacted: true,
          contactType: 'DIRECT',
          property: { 
            id: 100, 
            buildingId: 10,
            building: { id: 10, street: 'Main St', number: 10 }
          },
          seller: { id: 1, firstName: 'Agent', lastName: 'X' }
        }
      ] as any);

      prismaMock.mailboxing.findMany.mockResolvedValue([]);

      const result = await activityService.getActivityItems(query as any);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('followup');
      expect(result.pagination.total).toBe(1);
    });
  });
});

import followUpService from './FollowUpService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

jest.mock('@modules/reminders/services', () => ({
  reminderService: {
    createReminder: jest.fn(),
  }
}));

jest.mock('@modules/notifications/services/NotificationService', () => ({
  notificationService: {
    notifyPropertyVisit: jest.fn().mockResolvedValue({}),
  }
}));

describe('FollowUpService', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('createFollowUp', () => {
    it('should create a follow-up successfully', async () => {
      const input = {
        propertyId: 1,
        wasContacted: true,
        contactType: 'Llamada' as any,
        comment: 'Test comment',
      };
      const sellerId = 10;

      prismaMock.property.findUnique.mockResolvedValue({
        id: 1,
        propertyPersons: []
      } as any);

      prismaMock.followUp.create.mockResolvedValue({
        id: 100,
        ...input,
        sellerId,
        seller: { id: sellerId },
        property: { id: 1, building: { id: 5 } }
      } as any);

      const result = await followUpService.createFollowUp(input, sellerId);

      expect(result.id).toBe(100);
      expect(prismaMock.followUp.create).toHaveBeenCalled();
    });
  });

  describe('getFollowUps', () => {
    it('should return paginated follow-ups', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ roles: [] } as any);
      prismaMock.followUp.findMany.mockResolvedValue([]);
      prismaMock.followUp.count.mockResolvedValue(0);

      const result = await followUpService.getFollowUps({}, 1);

      expect(result.data).toBeInstanceOf(Array);
      expect(result.pagination.total).toBe(0);
    });
  });
});

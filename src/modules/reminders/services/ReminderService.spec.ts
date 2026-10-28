import { reminderService } from './ReminderService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from './../../../generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

describe('ReminderService', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('createReminder', () => {
    it('should create a reminder successfully', async () => {
      const input = {
        title: 'Call client',
        responsibleId: 1,
        scheduledAt: new Date().toISOString(),
        recurrence: { type: 'NONE' as any }
      };
      
      prismaMock.reminder.create.mockResolvedValue({
        id: 1,
        ...input,
        scheduledAt: new Date(),
        timezone: 'Europe/Madrid',
        status: 'active',
        responsible: { id: 1 }
      } as any);

      // Mock private method ensureOccurrencesForRange
      (reminderService as any).ensureOccurrencesForRange = jest.fn().mockResolvedValue([]);

      const result = await reminderService.createReminder(input as any, 10, null);

      expect(result.id).toBe(1);
    });
  });

  describe('getReminders', () => {
    it('should return paginated reminders', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ roles: [] } as any);
      prismaMock.reminder.findMany.mockResolvedValue([]);
      prismaMock.reminder.count.mockResolvedValue(0);

      const result = await reminderService.getReminders({}, 1, null);

      expect(result.data).toBeInstanceOf(Array);
      expect(result.pagination.total).toBe(0);
    });
  });
});

import { notificationService } from './NotificationService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

describe('NotificationService', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
    jest.clearAllMocks();
  });

  describe('notifyPropertyVisit', () => {
    it('should send email notification if owner preference is EMAIL', async () => {
      const mockFollowUp = {
        id: 1,
        executedDate: new Date(),
        seller: { firstName: 'Agent', lastName: 'Zero' },
        property: {
          building: { street: 'Main St', number: 10 },
          floor: '1',
          number: 'A',
          propertyPersons: [
            {
              role: 'owner',
              person: {
                firstName: 'John',
                email: 'john@example.com',
                notificationPreference: 'EMAIL',
                phones: []
              }
            }
          ]
        }
      };

      prismaMock.followUp.findUnique.mockResolvedValue(mockFollowUp as any);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await notificationService.notifyPropertyVisit(1);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[EMAIL]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('john@example.com'));
      
      consoleSpy.mockRestore();
    });

    it('should skip notification if preference is NONE', async () => {
        const mockFollowUp = {
          id: 1,
          seller: { firstName: 'Agent', lastName: 'Zero' },
          property: {
            building: { street: 'Main St', number: 10 },
            floor: '1',
            number: 'A',
            propertyPersons: [
              {
                role: 'owner',
                person: {
                  firstName: 'John',
                  notificationPreference: 'NONE',
                }
              }
            ]
          }
        };
  
        prismaMock.followUp.findUnique.mockResolvedValue(mockFollowUp as any);
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  
        await notificationService.notifyPropertyVisit(1);
  
        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
  });
});

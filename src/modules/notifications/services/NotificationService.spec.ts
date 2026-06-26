import { notificationService } from './NotificationService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from './../../../generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockRejectedValue(new Error('Mocked SMTP error')),
  })),
}));

describe('NotificationService', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockReset(prismaMock);
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('sendNotification', () => {
    it('should send email successfully', async () => {
      prismaMock.person.findUnique.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
        phones: [],
      } as any);

      const sendEmailSpy = jest.spyOn(notificationService as any, 'sendEmail')
        .mockResolvedValue({ channel: 'EMAIL', to: 'john@example.com', success: true });

      const result = await notificationService.sendNotification(1, 'EMAIL', 'Subject', 'Body');

      expect(result.success).toBe(true);
      expect(result.channel).toBe('EMAIL');

      sendEmailSpy.mockRestore();
    });

    it('should return error if person not found', async () => {
      prismaMock.person.findUnique.mockResolvedValue(null);

      const result = await notificationService.sendNotification(999, 'EMAIL', 'Subject', 'Body');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Persona no encontrada');
    });

    it('should return error if person has no email for EMAIL channel', async () => {
      prismaMock.person.findUnique.mockResolvedValue({
        id: 1,
        email: null,
        phones: [],
      } as any);

      const result = await notificationService.sendNotification(1, 'EMAIL', 'Subject', 'Body');

      expect(result.success).toBe(false);
      expect(result.error).toContain('no tiene email');
    });

    it('should send WhatsApp via fallback when Twilio is not configured', async () => {
      prismaMock.person.findUnique.mockResolvedValue({
        id: 1,
        phones: [{ phone: '+34123456789' }],
      } as any);

      const result = await notificationService.sendNotification(1, 'WHATSAPP', undefined, 'Hello');

      expect(result.success).toBe(true);
      expect(result.channel).toBe('WHATSAPP');
    });
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

      const sendEmailSpy = jest.spyOn(notificationService as any, 'sendEmail')
        .mockResolvedValue({ channel: 'EMAIL', to: 'john@example.com', success: true });

      await notificationService.notifyPropertyVisit(1);

      expect(sendEmailSpy).toHaveBeenCalled();
      expect(sendEmailSpy.mock.calls[0][0]).toBe('john@example.com');

      sendEmailSpy.mockRestore();
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

      const sendEmailSpy = jest.spyOn(notificationService as any, 'sendEmail')
        .mockResolvedValue({ channel: 'EMAIL', to: '', success: true });

      await notificationService.notifyPropertyVisit(1);

      expect(sendEmailSpy).not.toHaveBeenCalled();

      sendEmailSpy.mockRestore();
    });
  });
});

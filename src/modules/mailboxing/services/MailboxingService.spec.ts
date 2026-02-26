import mailboxingService from './MailboxingService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from './../../../generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

jest.mock('@core/services', () => ({
  S3StorageService: {
    getInstance: jest.fn().mockReturnValue({
      getSignedUrl: jest.fn().mockResolvedValue('http://mock-url'),
      uploadFile: jest.fn().mockResolvedValue({}),
      getPublicUrl: jest.fn().mockReturnValue('http://public-url'),
    }),
  },
}));

describe('MailboxingService', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('createMailboxing', () => {
    it('should create a mailboxing record', async () => {
      const input = {
        buildingId: 1,
        status: 'inside' as any,
        date: new Date().toISOString(),
      };
      const mailboxerId = 10;

      prismaMock.building.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.mailboxing.create.mockResolvedValue({
        id: 100,
        ...input,
        date: new Date(input.date),
        mailboxerId,
        attachments: []
      } as any);

      const result = await mailboxingService.createMailboxing(input as any, mailboxerId);

      expect(result.id).toBe(100);
      expect(prismaMock.mailboxing.create).toHaveBeenCalled();
    });
  });

  describe('getMailboxings', () => {
    it('should return list of mailboxings', async () => {
      prismaMock.mailboxing.findMany.mockResolvedValue([]);
      prismaMock.mailboxing.count.mockResolvedValue(0);

      const result = await mailboxingService.getMailboxings({}, 1, true);

      expect(result.data).toBeInstanceOf(Array);
      expect(result.pagination.total).toBe(0);
    });
  });
});

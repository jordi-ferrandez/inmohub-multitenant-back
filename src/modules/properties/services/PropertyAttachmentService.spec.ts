import { PropertyAttachmentService } from './PropertyAttachmentService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@generated/prisma';
import { S3StorageService } from '@core/services';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

jest.mock('@core/services', () => ({
  S3StorageService: {
    getInstance: jest.fn().mockReturnValue({
      uploadFile: jest.fn().mockResolvedValue({}),
      getPublicUrl: jest.fn().mockReturnValue('http://public'),
      getSignedUrl: jest.fn().mockResolvedValue('http://signed'),
      deleteFile: jest.fn().mockResolvedValue({}),
    }),
  },
}));

describe('PropertyAttachmentService', () => {
  let service: PropertyAttachmentService;
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
    service = new PropertyAttachmentService();
  });

  describe('list', () => {
    it('should list attachments for a property', async () => {
      prismaMock.property.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.propertyAttachment.findMany.mockResolvedValue([
        { id: 10, propertyId: 1, s3Key: 'key', url: 'url' }
      ] as any);

      const result = await service.list(1);

      expect(result).toHaveLength(1);
      expect(result[0].signedUrl).toBe('http://signed');
    });
  });

  describe('delete', () => {
    it('should soft delete and call S3', async () => {
      prismaMock.propertyAttachment.findFirst.mockResolvedValue({ id: 10, s3Key: 'key' } as any);
      
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
          return callback(prismaMock);
      });

      await service.delete(1, 10);

      expect(prismaMock.propertyAttachment.update).toHaveBeenCalled();
      expect(S3StorageService.getInstance().deleteFile).toHaveBeenCalledWith('key');
    });
  });
});

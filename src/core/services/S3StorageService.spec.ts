import { S3StorageService } from './S3StorageService';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('S3StorageService', () => {
  let s3Service: S3StorageService;
  let mockS3Client: any;

  beforeEach(() => {
    process.env.AWS_S3_BUCKET = 'test-bucket';
    process.env.AWS_S3_REGION = 'us-east-1';
    
    mockS3Client = {
      send: jest.fn().mockResolvedValue({}),
    };
    (S3Client as jest.Mock).mockReturnValue(mockS3Client);
    
    // @ts-ignore - access private instance for test isolation
    S3StorageService.instance = undefined;
    s3Service = S3StorageService.getInstance();
  });

  describe('uploadFile', () => {
    it('should send PutObjectCommand to S3 client', async () => {
      const params = {
        key: 'test-key',
        body: Buffer.from('test-body'),
        contentType: 'text/plain',
      };

      await s3Service.uploadFile(params);

      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });
  });

  describe('deleteFile', () => {
    it('should send DeleteObjectCommand to S3 client', async () => {
      await s3Service.deleteFile('test-key');
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });
  });

  describe('getSignedUrl', () => {
    it('should call getSignedUrl from presigner', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('http://signed-url');
      const url = await s3Service.getSignedUrl('test-key');
      expect(url).toBe('http://signed-url');
    });
  });

  describe('getPublicUrl', () => {
      it('should return correct public url', () => {
          const url = s3Service.getPublicUrl('test-key');
          expect(url).toBe('https://test-bucket.s3.us-east-1.amazonaws.com/test-key');
      });
  });
});

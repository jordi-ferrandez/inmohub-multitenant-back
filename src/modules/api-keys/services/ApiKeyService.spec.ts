import { apiKeyService } from './ApiKeyService';
import { prisma } from '@core/lib';
import { mockReset } from 'jest-mock-extended';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

describe('ApiKeyService', () => {
  const prismaMock: any = prisma;

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('createApiKey', () => {
    it('should create an API key with hash and prefix', async () => {
      const params = {
        userId: 1,
        name: 'Test Key',
        scopes: ['read:properties'],
      };

      prismaMock.apiKey.create.mockResolvedValue({
        id: 1,
        name: 'Test Key',
        keyHash: 'hashed',
        prefix: 'ih_abc',
        userId: 1,
        scopes: ['read:properties'],
        isActive: true,
        createdAt: new Date(),
      } as any);

      const result = await apiKeyService.createApiKey(params);

      expect(result.rawKey).toMatch(/^ih_/);
      expect(result.rawKey.length).toBeGreaterThan(7);
      expect(result.prefix).toBe('ih_abc');
      expect(prismaMock.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Key',
            userId: 1,
            scopes: ['read:properties'],
          }),
        })
      );
    });

    it('should generate different keys on each call', async () => {
      prismaMock.apiKey.create.mockResolvedValue({ id: 1 } as any);

      const result1 = await apiKeyService.createApiKey({ userId: 1, name: 'Key 1' });
      const result2 = await apiKeyService.createApiKey({ userId: 1, name: 'Key 2' });

      expect(result1.rawKey).not.toBe(result2.rawKey);
    });
  });

  describe('validateApiKey', () => {
    it('should return null for invalid prefix', async () => {
      const result = await apiKeyService.validateApiKey('invalid-key');
      expect(result).toBeNull();
    });

    it('should return null for empty key', async () => {
      const result = await apiKeyService.validateApiKey('');
      expect(result).toBeNull();
    });

    it('should return null for null key', async () => {
      const result = await apiKeyService.validateApiKey(null as any);
      expect(result).toBeNull();
    });

    it('should find and return a valid API key', async () => {
      const mockApiKey = {
        id: 1,
        keyHash: 'hashed',
        prefix: 'ih_abc',
        isActive: true,
        company: { id: 1, name: 'Test Corp' },
        user: { id: 1, isActive: true },
      };

      prismaMock.apiKey.findFirst.mockResolvedValue(mockApiKey as any);
      prismaMock.apiKey.update.mockResolvedValue(mockApiKey as any);

      const result = await apiKeyService.validateApiKey('ih_abcdef1234');

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
    });

    it('should update lastUsedAt after successful validation', async () => {
      const mockApiKey = {
        id: 1,
        isActive: true,
        company: { id: 1 },
        user: { id: 1, isActive: true },
      };

      prismaMock.apiKey.findFirst.mockResolvedValue(mockApiKey as any);
      prismaMock.apiKey.update.mockResolvedValue(mockApiKey as any);

      await apiKeyService.validateApiKey('ih_abcdef1234');

      // lastUsedAt update should be called asynchronously
      await new Promise(process.nextTick);
      expect(prismaMock.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ lastUsedAt: expect.any(Date) }),
        })
      );
    });
  });

  describe('listApiKeys', () => {
    it('should return keys ordered by creation date desc', async () => {
      prismaMock.apiKey.findMany.mockResolvedValue([
        { id: 2, name: 'Key 2', createdAt: new Date('2024-01-02') },
        { id: 1, name: 'Key 1', createdAt: new Date('2024-01-01') },
      ] as any);

      const result = await apiKeyService.listApiKeys(1);

      expect(result).toHaveLength(2);
      expect(prismaMock.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('revokeApiKey', () => {
    it('should deactivate the API key', async () => {
      prismaMock.apiKey.update.mockResolvedValue({
        id: 1,
        isActive: false,
      } as any);

      const result = await apiKeyService.revokeApiKey(1, 1);

      expect(prismaMock.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, userId: 1 },
          data: { isActive: false },
        })
      );
      expect(result.isActive).toBe(false);
    });
  });
});

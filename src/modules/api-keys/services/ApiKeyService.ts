import crypto from 'crypto';
import { prisma } from '@core/lib';

export class ApiKeyService {
  /**
   * Generates a new API Key for a user (can be optionally linked to a company)
   */
  async createApiKey(params: {
    userId: number;
    companyId?: number;
    name: string;
    scopes?: string[];
    expiresAt?: Date;
    restrictedIps?: string[];
  }) {
    const {
      userId,
      companyId,
      name,
      scopes = [],
      expiresAt,
      restrictedIps = [],
    } = params;

    // Generate a random secure key
    const rawKey = `ih_${crypto.randomBytes(32).toString('hex')}`;
    const prefix = rawKey.substring(0, 7); // ih_xxxx

    // Hash the key for storage
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        keyHash,
        prefix,
        userId,
        companyId,
        scopes,
        expiresAt,
        restrictedIps,
      },
    });

    return {
      ...apiKey,
      rawKey, // Only returned once
    };
  }

  /**
   * Validates an API Key and returns the associated company information
   */
  async validateApiKey(rawKey: string) {
    if (!rawKey || !rawKey.startsWith('ih_')) {
      return null;
    }

    const prefix = rawKey.substring(0, 7);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        prefix,
        keyHash,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        user: {
          isActive: true,
          deletedAt: null,
        },
      },
      include: {
        company: true,
        user: true,
      },
    });

    if (apiKey) {
      // Update last used timestamp (async)
      prisma.apiKey
        .update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        })
        .catch((err) => console.error('Error updating lastUsedAt:', err));
    }

    return apiKey;
  }

  /**
   * Lists API Keys for a user
   */
  async listApiKeys(userId: number) {
    return prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Revokes (deactivates) an API Key
   */
  async revokeApiKey(id: number, userId: number) {
    return prisma.apiKey.update({
      where: { id, userId },
      data: { isActive: false },
    });
  }
}

export const apiKeyService = new ApiKeyService();

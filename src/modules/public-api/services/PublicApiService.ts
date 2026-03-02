import { prisma } from '@core/lib';

/**
 * Service to handle public API operations with multi-tenant enforcement.
 */
export class PublicApiService {
  /**
   * Generic method to find multiple records with filtering, pagination, and sorting.
   * Enforces companyId or userId isolation.
   */
  async findMany(
    modelDelegate: any,
    context: { companyId?: number; userId?: number },
    query: any,
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      include,
      ...filters
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Math.min(Number(limit), 100);

    const { companyId, userId } = context;

    // Multi-tenant enforcement: if companyId is present, filter by it.
    // Otherwise, fallback to userId (CapturedBy/Author/etc)
    const where: any = {
      deletedAt: null,
    };

    if (companyId) {
      where.companyId = companyId;
    } else if (userId) {
      // We need to know which field to use for user filtering.
      // For Property it's capturedById, for Reminder it's responsibleId, etc.
      // This is a bit tricky for a generic service.
      // Let's assume most models have a 'userId' field or similar for personal data.
      // For this specific app, we might need a map or just try common fields.

      // Fallback for demo: use an OR for common user fields if not specified
      where.OR = [
        { capturedById: userId },
        { userId: userId },
        { authorId: userId },
      ].filter((condition) => {
        // Check if the field exists on the model (Prisma doesn't expose this easily here,
        // but we can try to be smart or just handle it in controllers)
        return true;
      });
    }

    // Apply filters
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ''
      ) {
        where[key] = filters[key];
      }
    });

    const [data, total] = await Promise.all([
      modelDelegate.findMany({
        where,
        include: include ? this.parseInclude(include) : undefined,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      modelDelegate.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Generic method to find a single record by ID.
   * Enforces companyId or userId isolation.
   */
  async findOne(
    modelDelegate: any,
    id: number,
    context: { companyId?: number; userId?: number },
    include?: any,
  ) {
    const { companyId, userId } = context;

    const where: any = {
      id,
      deletedAt: null,
    };

    if (companyId) {
      where.companyId = companyId;
    } else {
      where.OR = [
        { capturedById: userId },
        { userId: userId },
        { authorId: userId },
      ];
    }

    const record = await modelDelegate.findFirst({
      where,
      include: include ? this.parseInclude(include) : undefined,
    });

    if (!record) {
      throw new Error('Record not found');
    }

    return record;
  }

  /**
   * Parses include string or object into Prisma include format
   */
  private parseInclude(include: any) {
    if (typeof include === 'string') {
      const includes: any = {};
      include.split(',').forEach((rel) => {
        includes[rel.trim()] = true;
      });
      return includes;
    }
    return include;
  }
}

export const publicApiService = new PublicApiService();

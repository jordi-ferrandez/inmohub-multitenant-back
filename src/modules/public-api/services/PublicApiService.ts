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

    const { companyId } = context;

    // Multi-tenant enforcement: public API data must be scoped by company.
    // If no companyId is present, deny access rather than guessing model-specific user fields.
    if (!companyId) {
      throw new Error('API key sin empresa asociada: acceso denegado');
    }

    const where: any = {
      deletedAt: null,
      companyId,
    };

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
    const { companyId } = context;

    if (!companyId) {
      throw new Error('API key sin empresa asociada: acceso denegado');
    }

    const where: any = {
      id,
      deletedAt: null,
      companyId,
    };

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

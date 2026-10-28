import { prisma } from "@core/lib";
import { SuperadminUserQueryParams, SuperadminStatsDTO } from "../types";

class SuperadminUserService {
  async getUsers(query: SuperadminUserQueryParams) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search;
    const role = query.role;
    const isActive = query.isActive;
    const companyId = query.companyId;
    const sortBy = query.sortBy ?? "createdAt";
    const sortOrder = query.sortOrder ?? "desc";

    const skip = (page - 1) * limit;

    const where: any = {};

    if (companyId !== undefined) {
      where.companyId = companyId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (role) {
      where.roles = {
        some: {
          role: { name: role },
        },
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          roles: {
            where: { deletedAt: null },
            include: {
              role: { select: { id: true, name: true, displayName: true } },
            },
          },
          company: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        isSuperAdmin: user.isSuperAdmin,
        companyId: user.companyId,
        companyName: user.company?.name,
        roles: user.roles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          displayName: ur.role.displayName,
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async moveUserToCompany(userId: number, companyId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId, deletedAt: null },
    });

    if (!company) {
      throw new Error("Empresa no encontrada");
    }

    return prisma.user.update({
      where: { id: userId },
      data: { companyId },
    });
  }

  async getStats(): Promise<SuperadminStatsDTO> {
    const [totalCompanies, totalUsers, totalProperties, totalBuildings] =
      await Promise.all([
        prisma.company.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.property.count({ where: { deletedAt: null } }),
        prisma.building.count({ where: { deletedAt: null } }),
      ]);

    const companies = await prisma.company.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: { where: { deletedAt: null } },
            properties: { where: { deletedAt: null } },
            buildings: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return {
      totalCompanies,
      totalUsers,
      totalProperties,
      totalBuildings,
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        userCount: c._count.users,
        propertyCount: c._count.properties,
        buildingCount: c._count.buildings,
      })),
    };
  }
}

export const superadminUserService = new SuperadminUserService();

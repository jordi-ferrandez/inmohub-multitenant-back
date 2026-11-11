import { hash } from "bcryptjs";
import { prisma } from "@core/lib";
import { getEnvironmentVariables } from "@core/utils";
import {
  SuperadminUserQueryParams,
  SuperadminStatsDTO,
  SuperadminUserDTO,
  SuperadminRoleDTO,
  CreateSuperadminUserDTO,
  UpdateSuperadminUserDTO,
} from "../types";

const SALT_ROUNDS = getEnvironmentVariables().SALT_ROUNDS;

class SuperadminUserService {
  /** Mapea un usuario de Prisma (con roles/company incluidos) al DTO de respuesta */
  private mapUser(user: any): SuperadminUserDTO {
    return {
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
      roles: user.roles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        displayName: ur.role.displayName,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /** Include estándar de roles activos + empresa */
  private get userInclude() {
    return {
      roles: {
        where: { deletedAt: null },
        include: {
          role: { select: { id: true, name: true, displayName: true } },
        },
      },
      company: { select: { id: true, name: true } },
    };
  }

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

    const where: any = {
      // Excluir usuarios con soft delete
      deletedAt: null,
    };

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
        include: this.userInclude,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => this.mapUser(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Crea un usuario global. Si `isSuperAdmin` es true se crea sin empresa y
   * sin roles (el superadmin es un flag, no un rol).
   */
  async createUser(
    input: CreateSuperadminUserDTO
  ): Promise<SuperadminUserDTO> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error("El email ya está registrado");
    }

    const isSuperAdmin = input.isSuperAdmin ?? false;
    // Los superadmins no pertenecen a ninguna empresa
    const companyId = isSuperAdmin ? null : input.companyId ?? null;

    if (!isSuperAdmin && companyId !== null) {
      const company = await prisma.company.findFirst({
        where: { id: companyId, deletedAt: null },
      });
      if (!company) {
        throw new Error("Empresa no encontrada");
      }
    }

    // Roles: solo aplican a usuarios con empresa (no a superadmins)
    let roleIds: number[] = [];
    if (!isSuperAdmin && input.roleIds && input.roleIds.length > 0) {
      roleIds = Array.from(new Set(input.roleIds));
      const roles = await prisma.role.findMany({
        where: {
          id: { in: roleIds },
          deletedAt: null,
          OR: [{ companyId }, { companyId: null }],
        },
      });
      if (roles.length !== roleIds.length) {
        throw new Error(
          "Uno o más roles no existen o no están disponibles para esta empresa"
        );
      }
    }

    const passwordHash = await hash(input.password, SALT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          isActive: input.isActive ?? true,
          isSuperAdmin,
          companyId,
        },
      });

      for (const roleId of roleIds) {
        await tx.userRole.create({
          data: { userId: created.id, roleId },
        });
      }

      return tx.user.findUnique({
        where: { id: created.id },
        include: this.userInclude,
      });
    });

    if (!user) {
      throw new Error("Error al crear el usuario");
    }

    return this.mapUser(user);
  }

  /**
   * Actualiza un usuario global (datos, estado, empresa, roles, contraseña y
   * flag de superadmin). Incluye protecciones para que un superadmin no se
   * desactive ni se degrade a sí mismo (evita quedarse sin acceso).
   */
  async updateUser(
    id: number,
    input: UpdateSuperadminUserDTO,
    currentUserId: number
  ): Promise<SuperadminUserDTO> {
    const existingUser = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: this.userInclude,
    });

    if (!existingUser) {
      throw new Error("Usuario no encontrado");
    }

    // Email único si se cambia
    if (input.email && input.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (emailExists) {
        throw new Error("El email ya está registrado");
      }
    }

    // Protecciones de autobloqueo
    if (id === currentUserId) {
      if (input.isSuperAdmin === false) {
        throw new Error(
          "No puedes quitarte a ti mismo los permisos de superadministrador"
        );
      }
      if (input.isActive === false) {
        throw new Error("No puedes desactivar tu propia cuenta");
      }
    }

    const data: any = {};
    if (input.email !== undefined) data.email = input.email;
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.password) {
      data.passwordHash = await hash(input.password, SALT_ROUNDS);
    }

    const effectiveIsSuperAdmin =
      input.isSuperAdmin !== undefined
        ? input.isSuperAdmin
        : existingUser.isSuperAdmin;

    if (input.isSuperAdmin !== undefined) {
      data.isSuperAdmin = input.isSuperAdmin;
      // Un superadmin no pertenece a ninguna empresa
      if (input.isSuperAdmin === true) {
        data.companyId = null;
      }
    }

    if (input.companyId !== undefined) {
      if (input.companyId !== null) {
        const company = await prisma.company.findFirst({
          where: { id: input.companyId, deletedAt: null },
        });
        if (!company) {
          throw new Error("Empresa no encontrada");
        }
      }
      data.companyId = input.companyId;
    }

    const effectiveCompanyId =
      data.companyId !== undefined ? data.companyId : existingUser.companyId;

    if (effectiveIsSuperAdmin && effectiveCompanyId !== null) {
      throw new Error("Un superadministrador no puede pertenecer a una empresa");
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // Si se promueve a superadmin, retirar sus roles de empresa (soft delete)
      if (input.isSuperAdmin === true) {
        await tx.userRole.updateMany({
          where: { userId: id, deletedAt: null },
          data: { deletedAt: new Date() },
        });
      }

      // Sincronizar roles si vienen y el usuario no es (ni será) superadmin
      if (input.roleIds && !effectiveIsSuperAdmin) {
        const uniqueRoleIds = Array.from(new Set(input.roleIds));

        if (uniqueRoleIds.length === 0) {
          throw new Error("Debe proporcionar al menos un rol");
        }

        const roles = await tx.role.findMany({
          where: {
            id: { in: uniqueRoleIds },
            deletedAt: null,
            OR: [{ companyId: effectiveCompanyId }, { companyId: null }],
          },
        });
        if (roles.length !== uniqueRoleIds.length) {
          throw new Error(
            "Uno o más roles no existen o no están disponibles para esta empresa"
          );
        }

        // Soft delete de roles que ya no aplican
        await tx.userRole.updateMany({
          where: {
            userId: id,
            roleId: { notIn: uniqueRoleIds },
            deletedAt: null,
          },
          data: { deletedAt: new Date() },
        });

        // Crear o reactivar roles
        for (const roleId of uniqueRoleIds) {
          const existingUserRole = await tx.userRole.findUnique({
            where: { userId_roleId: { userId: id, roleId } },
          });
          if (!existingUserRole) {
            await tx.userRole.create({
              data: { userId: id, roleId },
            });
          } else if (existingUserRole.deletedAt !== null) {
            await tx.userRole.update({
              where: { userId_roleId: { userId: id, roleId } },
              data: { deletedAt: null, updatedAt: new Date() },
            });
          }
        }
      }

      await tx.user.update({ where: { id }, data });

      return tx.user.findUnique({
        where: { id },
        include: this.userInclude,
      });
    });

    if (!updatedUser) {
      throw new Error("Error al actualizar el usuario");
    }

    return this.mapUser(updatedUser);
  }

  /**
   * Roles disponibles para asignar. Sin `companyId` devuelve los roles
   * globales del sistema; con `companyId` añade los de esa empresa.
   */
  async getRoles(companyId?: number): Promise<SuperadminRoleDTO[]> {
    const where: any = {
      deletedAt: null,
      OR: companyId
        ? [{ companyId: null }, { companyId }]
        : [{ companyId: null }],
    };

    const roles = await prisma.role.findMany({
      where,
      select: { id: true, name: true, displayName: true },
    });

    // Ordenar por jerarquía: Director, Responsible, Agent, Mailboxer
    const hierarchy = ["Director", "Responsible", "Agent", "Mailboxer"];
    return roles.sort((a, b) => {
      const indexA = hierarchy.indexOf(a.name);
      const indexB = hierarchy.indexOf(b.name);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
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

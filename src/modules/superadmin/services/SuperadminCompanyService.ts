import { prisma } from "@core/lib";
import { CreateCompanyDTO, UpdateCompanyDTO, CompanyDTO } from "../types";

class SuperadminCompanyService {
  async createCompany(data: CreateCompanyDTO): Promise<CompanyDTO> {
    const existingCompany = await prisma.company.findUnique({
      where: { name: data.name },
    });

    if (existingCompany) {
      throw new Error("Ya existe una empresa con ese nombre");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.directorEmail },
    });

    if (existingUser) {
      throw new Error("Ya existe un usuario con ese email");
    }

    const { hash } = await import("bcryptjs");
    const SALT_ROUNDS = 10;
    const passwordHash = await hash(data.directorPassword, SALT_ROUNDS);

    const directorRole = await prisma.role.findFirst({
      where: { name: "Director", companyId: null },
    });

    if (!directorRole) {
      throw new Error("Rol Director no configurado en el sistema");
    }

    const company = await prisma.$transaction(async (tx) => {
      const newCompany = await tx.company.create({
        data: { name: data.name },
      });

      await tx.user.create({
        data: {
          email: data.directorEmail,
          passwordHash,
          firstName: data.directorFirstName,
          lastName: data.directorLastName,
          companyId: newCompany.id,
          isActive: true,
          roles: {
            create: {
              roleId: directorRole.id,
            },
          },
        },
      });

      return newCompany;
    });

    return {
      id: company.id,
      name: company.name,
      isActive: company.isActive,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      userCount: 1,
      propertyCount: 0,
      buildingCount: 0,
    };
  }

  async getAllCompanies(): Promise<CompanyDTO[]> {
    const companies = await prisma.company.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: { where: { deletedAt: null } },
            properties: { where: { deletedAt: null } },
            buildings: { where: { deletedAt: null } },
          },
        },
      },
    });

    return companies.map((company) => ({
      id: company.id,
      name: company.name,
      isActive: company.isActive,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      userCount: company._count.users,
      propertyCount: company._count.properties,
      buildingCount: company._count.buildings,
    }));
  }

  async getCompanyById(id: number): Promise<CompanyDTO | null> {
    const company = await prisma.company.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            users: { where: { deletedAt: null } },
            properties: { where: { deletedAt: null } },
            buildings: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!company) return null;

    return {
      id: company.id,
      name: company.name,
      isActive: company.isActive,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      userCount: company._count.users,
      propertyCount: company._count.properties,
      buildingCount: company._count.buildings,
    };
  }

  async updateCompany(id: number, data: UpdateCompanyDTO): Promise<CompanyDTO> {
    const existing = await prisma.company.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new Error("Empresa no encontrada");
    }

    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.company.findUnique({
        where: { name: data.name },
      });
      if (nameExists) {
        throw new Error("Ya existe una empresa con ese nombre");
      }
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: data.name,
        isActive: data.isActive,
      },
    });

    return {
      id: company.id,
      name: company.name,
      isActive: company.isActive,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }

  async deleteCompany(id: number): Promise<void> {
    const existing = await prisma.company.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new Error("Empresa no encontrada");
    }

    await prisma.company.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}

export const superadminCompanyService = new SuperadminCompanyService();

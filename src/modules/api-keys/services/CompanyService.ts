import { prisma } from "@core/lib";

export class CompanyService {
  async createCompany(name: string) {
    return prisma.company.create({
      data: { name }
    });
  }

  async getCompanyById(id: number) {
    return prisma.company.findUnique({
      where: { id, deletedAt: null }
    });
  }

  async listCompanies() {
    return prisma.company.findMany({
      where: { deletedAt: null }
    });
  }
}

export const companyService = new CompanyService();
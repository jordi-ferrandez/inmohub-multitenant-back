import { prisma } from "@core/lib";
import { CreateFlyerDTO } from "../types/FlyerTypes";

export class FlyerService {
  private propertyFilter(companyId: number | null) {
    return companyId ? { property: { companyId } } : {};
  }

  async getTemplates(companyId: number | null) {
    return prisma.flyerTemplate.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });
  }

  async getFlyersByProperty(propertyId: number, companyId: number | null) {
    if (companyId) {
      const property = await prisma.property.findFirst({ where: { id: propertyId, companyId } });
      if (!property) throw new Error("Propiedad no encontrada");
    }
    return prisma.flyer.findMany({
      where: {
        propertyId,
        deletedAt: null,
        ...this.propertyFilter(companyId),
      },
      include: {
        template: true,
        generatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async createFlyer(data: CreateFlyerDTO, companyId: number | null) {
    if (companyId) {
      const property = await prisma.property.findFirst({ where: { id: data.propertyId, companyId } });
      if (!property) throw new Error("Propiedad no encontrada");
      const user = await prisma.user.findUnique({ where: { id: data.generatedById } });
      if (!user || user.companyId !== companyId) throw new Error("Usuario no encontrado");
    }
    return prisma.flyer.create({
      data,
      include: {
        template: true,
      },
    });
  }

  async recordShipment(flyerId: number, userId: number, notes: string | undefined, companyId: number | null) {
    if (companyId) {
      const flyer = await prisma.flyer.findFirst({ where: { id: flyerId, ...this.propertyFilter(companyId) } });
      if (!flyer) throw new Error("Flyer no encontrado");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.companyId !== companyId) throw new Error("Usuario no encontrado");
    }
    return prisma.flyerShipment.create({
      data: {
        flyerId,
        userId,
        notes,
      },
    });
  }

  async getShipmentsByFlyer(flyerId: number, companyId: number | null) {
    if (companyId) {
      const flyer = await prisma.flyer.findFirst({ where: { id: flyerId, ...this.propertyFilter(companyId) } });
      if (!flyer) throw new Error("Flyer no encontrado");
    }
    return prisma.flyerShipment.findMany({
      where: { flyerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

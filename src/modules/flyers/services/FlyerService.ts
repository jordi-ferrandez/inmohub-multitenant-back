import { prisma } from "@core/lib";
import { CreateFlyerDTO } from "../types/FlyerTypes";

export class FlyerService {
  async getTemplates() {
    return prisma.flyerTemplate.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });
  }

  async getFlyersByProperty(propertyId: number) {
    return prisma.flyer.findMany({
      where: {
        propertyId,
        deletedAt: null,
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

  async createFlyer(data: CreateFlyerDTO) {
    return prisma.flyer.create({
      data,
      include: {
        template: true,
      },
    });
  }

  async recordShipment(flyerId: number, userId: number, notes?: string) {
    return prisma.flyerShipment.create({
      data: {
        flyerId,
        userId,
        notes,
      },
    });
  }

  async getShipmentsByFlyer(flyerId: number) {
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

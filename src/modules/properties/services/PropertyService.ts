import { prisma } from "@core/lib";
import { Property } from "@generated/prisma";

export class PropertyService {
  propertyRelations = {
    attachments: true,
    building: true,
    capturedBy: true,
    followUps: true,
    owner: true, // Legacy, mantener para compatibilidad
    tenant: true, // Legacy, mantener para compatibilidad
    listings: true,
    propertyPersons: {
      where: {
        deletedAt: null,
      },
      include: {
        person: {
          include: {
            phones: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    },
  };
  async getPropertyById(id: number): Promise<Property> {
    const property = await prisma.property.findUnique({
      where: { id },
      include: this.propertyRelations,
    });
    if (!property) throw new Error("No existe una property con ese id");
    return property;
  }

  async patchPropertyById(
    id: number,
    data: Partial<Property>
  ): Promise<Property> {
    const property = await prisma.property.update({
      where: { id },
      data,
      include: this.propertyRelations,
    });
    if (!property) throw new Error("No existe una property con ese id");
    return property;
  }

  async getProperty(
  ) {
    const property = await prisma.property.findMany({
      include: this.propertyRelations,      
    });
    if (!property) throw new Error("No existe properties");
    return property;
  }


}

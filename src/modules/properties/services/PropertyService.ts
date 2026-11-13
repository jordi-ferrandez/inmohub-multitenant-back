import { prisma } from "@core/lib";
import { catastroService } from "@modules/catastro/services";
import { Prisma, Property } from "../../../generated/prisma";
import {
  GetPropertiesQuery,
} from "../types/propertyTypes";
import {
  CatastroBuildingData,
  mapCatastroToProperty,
} from "../utils/catastroToProperty";

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

  private buildTenantFilter(companyId: number | null): { companyId?: number } {
    return companyId ? { companyId } : {};
  }

  async getPropertyById(id: number, companyId: number | null): Promise<Property> {
    const property = await prisma.property.findFirst({
      where: { id, ...this.buildTenantFilter(companyId) },
      include: this.propertyRelations,
    });
    if (!property) throw new Error("No existe una property con ese id");
    return property;
  }

  async createProperty(data: any, companyId: number | null): Promise<Property> {
    try {
      const property = await prisma.property.create({
        data: {
          buildingId: Number(data.buildingId),
          floor: data.floor ? Number(data.floor) : 0,
          number: String(data.number),
          inmovillaCode: data.inmovillaCode ? Number(data.inmovillaCode) : undefined,
          status: data.status || "sin_estado",
          companyId: companyId ?? undefined,
        },
        include: this.propertyRelations,
      });
      return property;
    } catch (error) {
      throw new Error(`Error creating property: ${error}`);
    }
  }

  async deleteProperty(id: number, companyId: number | null): Promise<void> {
    try {
      await prisma.property.updateMany({
        where: { id, ...this.buildTenantFilter(companyId) },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      throw new Error(`Error deleting property: ${error}`);
    }
  }


  async patchPropertyById(
    id: number,
    data: Partial<Property>,
    companyId: number | null
  ): Promise<Property> {
    const property = await prisma.property.update({
      where: { id, ...this.buildTenantFilter(companyId) },
      data,
      include: this.propertyRelations,
    });
    if (!property) throw new Error("No existe una property con ese id");
    return property;
  }

  async getProperty(filters: GetPropertiesQuery, companyId: number | null) {
    const { page, limit, ...filterData } = filters;
    const skip = (page - 1) * limit;

    const myInmovillaCode  = filterData.inmovillaCode   ? filterData.inmovillaCode  : undefined;
    const myNumber= filterData.number  ? filterData.number : undefined;
    const myFloor = filterData.floor  ? filterData.floor : undefined;

    const myStartAppraisalPrice   = filterData.startAppraisalPrice ? filterData.startAppraisalPrice : undefined;
    const myEndAppraisalPrice     = filterData.endAppraisalPrice ? filterData.endAppraisalPrice : undefined;

    const myStartSalePrice  = filterData.startSalePrice ? filterData.startSalePrice : undefined;
    const myEndSalePrice    = filterData.endSalePrice ? filterData.endSalePrice : undefined;

    const myStartRentalPrice  = filterData.startRentalPrice ? filterData.startRentalPrice : undefined;
    const myEndRentalPrice    = filterData.endRentalPrice ? filterData.endRentalPrice : undefined;

    const tenantFilter = this.buildTenantFilter(companyId);

    const [property, totalItems] = await prisma.$transaction([
      prisma.property.findMany({
        skip: skip,
        take: limit,
        include: this.propertyRelations,
        where: {
          ...tenantFilter,
          inmovillaCode: myInmovillaCode,
          number: myNumber,
          floor: myFloor,
          appraisalPrice: {
            gte: myStartAppraisalPrice,
            lte: myEndAppraisalPrice,
          },
          salePrice: {
            gte: myStartSalePrice,
            lte: myEndSalePrice,
          },
          rentalPrice: {
            gte: myStartRentalPrice,
            lte: myEndRentalPrice,
          }
        }
      }),
      prisma.property.count({
        where: {
          ...tenantFilter,
          inmovillaCode: myInmovillaCode,
          number: myNumber,
          floor: myFloor,
        }
      }),
    ]);

    if (!property) throw new Error("No existe properties");

    const totalPages = Math.ceil(totalItems / limit);

    return { data: property, meta: { totalItems, page, limit, totalPages } };

  }
  async getPropertyByRefCatastral(refCatastral: string): Promise<Property | null> {
    if (!refCatastral) return null;
    return prisma.property.findFirst({
      where: { refCatastral, deletedAt: null },
      include: this.propertyRelations,
    });
  }

  async getSavedRefCatastrals(refs: string[], companyId: number | null): Promise<string[]> {
    if (!refs.length) return [];
    const rows = await prisma.property.findMany({
      where: { refCatastral: { in: refs }, deletedAt: null, companyId },
      select: { refCatastral: true },
    });
    return rows
      .map((row) => row.refCatastral)
      .filter((ref): ref is string => Boolean(ref));
  }

  private async resolveBuildingFromCatastro(
    building: CatastroBuildingData
  ) {
    const existing = await prisma.building.findFirst({
      where: {
        street: building.street,
        number: building.number,
        stair: building.stair,
        block: null,
        deletedAt: null,
      },
    });
    if (existing) return existing;

    return prisma.building.create({
      data: {
        street: building.street,
        number: building.number,
        stair: building.stair,
      },
    });
  }

  /**
   * Guarda un inmueble de Catastro como `Property` (creando o reutilizando su
   * `Building`). Si la referencia ya estaba guardada no se duplica: se devuelve
   * la propiedad existente con `alreadySaved: true`.
   */
  async createPropertyFromCatastro(data: {
    refCatastral: string;
    buildingId?: number;
    description?: string;
    companyId: number 
  }): Promise<{ property: Property; alreadySaved: boolean }> {
    const refCatastral = data.refCatastral.trim().toUpperCase();

    const existing = await this.getPropertyByRefCatastral(refCatastral);
    if (existing) {
      return { property: existing, alreadySaved: true };
    }

    // Puede existir una propiedad borrada (soft delete) con esa referencia: el
    // índice único impide crear otra, así que la reactivamos.
    const softDeleted = await prisma.property.findFirst({
      where: { refCatastral, deletedAt: { not: null } },
    });

    const catastroResponse =
      await catastroService.getInmuebleByrefCatastral(refCatastral);
    const bico = catastroResponse?.consulta_dnprcResult?.bico;

    if (!bico?.bi?.idbi?.rc) {
      const notFound: any = new Error(
        "No se han encontrado datos en Catastro para esa referencia catastral"
      );
      notFound.statusCode = 404;
      throw notFound;
    }

    const { building, property } = mapCatastroToProperty(bico, refCatastral);

    // Un Building por portal: se reutiliza el que coincida en calle+número+escalera.
    const resolvedBuilding = data.buildingId
      ? await prisma.building.findUnique({ where: { id: data.buildingId } })
      : await this.resolveBuildingFromCatastro(building);

    if (!resolvedBuilding) {
      const notFound: any = new Error("No existe el edificio indicado");
      notFound.statusCode = 404;
      throw notFound;
    }

    const payload = {
      ...property,
      description: data.description ?? property.description,
      status: "sin_estado",
      buildingId: resolvedBuilding.id,
      tenantId:data.companyId ?? undefined,
    } as Prisma.PropertyUncheckedCreateInput;

    try {
      if (softDeleted) {
        const revived = await prisma.property.update({
          where: { id: softDeleted.id },
          data: {
            ...property,
            description: data.description ?? property.description,
            buildingId: resolvedBuilding.id,
            deletedAt: null,
          } as Prisma.PropertyUncheckedUpdateInput,
          include: this.propertyRelations,
        });

        return { property: revived, alreadySaved: false };
      }

      const created = await prisma.property.create({
        data: payload,
        include: this.propertyRelations,
      });

      return { property: created, alreadySaved: false };
    } catch (error: any) {
      // Carrera: otra petición guardó la misma referencia entre la comprobación
      // y el create. Devolvemos la existente en lugar de fallar.
      if (error?.code === "P2002") {
        const alreadySaved = await this.getPropertyByRefCatastral(refCatastral);
        if (alreadySaved) {
          return { property: alreadySaved, alreadySaved: true };
        }
      }
      throw new Error(
        `Error creating property from Catastro: ${error?.message ?? error}`
      );
    }
  }

}

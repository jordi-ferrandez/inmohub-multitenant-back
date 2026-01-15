import { prisma } from "@core/lib";
import { Building, Prisma, Property } from "@generated/prisma";
import {
  BuildingResponseDTO,
  GetBuildingByIdParams,
  GetBuildingsByStreetNameParams,
  GetBuildingsByStreetNameQuery,
  GetBuildingsGroupedByStreetsDTO,
  GetBuildingsQuery,
  GetBuildingMailboxingsParams,
  GetBuildingMailboxingsQuery,
} from "../types/buildingTypes";
import { getNameAndNumberFromStreet } from "../utils/getNameAndNumberFromStreet";
import {
  MailboxingDTO,
  MailboxingListResponse,
} from "@modules/mailboxing/types";
import { S3StorageService } from "@core/services";

const toBuildingResponseDTO = (building: Building): BuildingResponseDTO => ({
  id: building.id,
  street: building.street,
  number: building.number,
  block: building.block ?? "",
  stair: building.stair ?? "",
  createdAt: building.createdAt,
  updatedAt: building.updatedAt,
  properties: [],
});

export class BuildingService {
  async getBuildingsGroupedByStreets(): Promise<GetBuildingsGroupedByStreetsDTO> {
    const allBuildings = await prisma.building.findMany({
      orderBy: { street: "asc" },
    });

    const groupedByStreet = allBuildings.reduce<
      Record<string, BuildingResponseDTO[]>
    >((acc, building) => {
      const street = building.street;
      if (!acc[street]) {
        acc[street] = [];
      }
      acc[street].push(toBuildingResponseDTO(building));
      return acc;
    }, {});

    const response = Object.entries(groupedByStreet).map(
      ([street, buildings]) => ({
        street,
        buildings,
      })
    );

    return response;
  }

  async getBuildings(filters: GetBuildingsQuery) {
    const { page, limit, ...filterData } = filters;
    const skip = (page - 1) * limit;
    const where: Prisma.BuildingWhereInput = {};

    if (filterData.street) {
      where.street = { contains: filterData.street, mode: "insensitive" };
    }
    if (filterData.number) {
      where.number = filterData.number;
    }
    if (filterData.block) {
      where.block = { contains: filterData.block, mode: "insensitive" };
    }
    if (filterData.stair) {
      where.stair = { contains: filterData.stair, mode: "insensitive" };
    }

    const [buildings, totalItems] = await prisma.$transaction([
      prisma.building.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ street: "asc" }, { number: "asc" }],
        include: {
          properties: true,
        },
      }),
      prisma.building.count({ where }),
    ]);

    console.log("Buioldings found:", buildings);

    const totalPages = Math.ceil(totalItems / limit);

    return { data: buildings, meta: { totalItems, page, limit, totalPages } };
  }

  async getBuildingsByStreetName(
    params: GetBuildingsByStreetNameParams,
    filters: GetBuildingsByStreetNameQuery
  ) {
    const { name } = params;
    const { page, limit } = filters;
    const skip = (page - 1) * limit;
    const { streetString, propertyNumber } = getNameAndNumberFromStreet(name);

    console.log({ streetString, propertyNumber });

    const where: Prisma.BuildingWhereInput = {
      street: {
        contains: streetString,

        mode: "insensitive",
      },
    };

    if (propertyNumber !== -1) {
      where["number"] = {
        equals: propertyNumber,
      };
    }

    const [buildings, totalItems] = await prisma.$transaction([
      prisma.building.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          street: true,
          number: true,
          block: true,
          stair: true,
          properties: {
            select: {
              id: true,
              status: true,
              listings: {
                select: {
                  listingType: { select: { name: true } },
                },
              },
              followUps: {
                select: {
                  id: true,
                  executedDate: true,
                  deletedAt: true,
                },
              },
            },
          },
          mailboxing: {
            select: {
              id: true,
              status: true,
              date: true,
              createdAt: true,
              deletedAt: true,
            },
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          },
        },
        where,
        orderBy: [{ street: "asc" }, { number: "asc" }],
      }),
      prisma.building.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const hundredEightyDaysAgo = new Date(
      now.getTime() - 180 * 24 * 60 * 60 * 1000
    );

    const result = buildings.map((building) => {
      console.log("Building:", { building });
      const countOfProperties = building.properties.length;
      let countOfListingSales = 0;
      let countOfListingTenancy = 0;

      // Contadores de seguimientos por antigüedad
      // Contamos PUERTAS, no seguimientos individuales
      let followUpsRecent = 0;
      let followUpsMedium = 0;
      let followUpsOld = 0;
      let followUpsNone = 0;

      building.properties.forEach((property) => {
        // Contar propiedades basándose en el status, no en los listings
        if (property.status === "noticia_venta") {
          countOfListingSales++;
        }
        if (property.status === "noticia_alquiler") {
          countOfListingTenancy++;
        }

        // Obtener el último seguimiento de esta puerta
        const lastFollowUp = property.followUps
          .filter((fu) => fu.deletedAt === null && fu.executedDate !== null)
          .sort((a, b) => {
            const dateA = new Date(a.executedDate!).getTime();
            const dateB = new Date(b.executedDate!).getTime();
            return dateB - dateA;
          })[0];

        if (lastFollowUp) {
          const executedDate = new Date(lastFollowUp.executedDate!);
          if (executedDate >= ninetyDaysAgo) {
            followUpsRecent++;
          } else if (executedDate >= hundredEightyDaysAgo) {
            followUpsMedium++;
          } else {
            followUpsOld++;
          }
        } else {
          followUpsNone++;
        }
      });

      const countOfFollowUps = building.properties.reduce(
        (acc, property) =>
          acc + property.followUps.filter((fu) => fu.deletedAt === null).length,
        0
      );

      // Contar buzoneamiento por estado
      // Verde = Buzoneamiento dentro (status = 'inside')
      // Amarillo/Naranja = Buzoneamiento fuera (status = 'outside')
      // Gris = Sin buzoneamiento o no_disturb (status = 'no_disturb')
      let mailboxingInside = 0; // Verde
      let mailboxingOutside = 0; // Amarillo/Naranja
      let mailboxingNone = building.properties.length; // Sin buzoneamiento o no_disturb

      building.mailboxing
        .filter((mb) => mb.deletedAt === null)
        .forEach((mailbox) => {
          if (mailbox.status === "inside") {
            mailboxingInside++;
            mailboxingNone--;
          } else if (mailbox.status === "outside") {
            mailboxingOutside++;
            mailboxingNone--;
          } else if (mailbox.status === "no_disturb") {
            // no_disturb también cuenta como "ninguno" para métricas
            mailboxingNone--;
          }
        });

      // Obtener último buzoneamiento para calcular badge de color
      const lastMailboxing = building.mailboxing
        .filter((mb) => mb.deletedAt === null)
        .sort((a, b) => {
          // Ordenar por date DESC, luego por createdAt DESC
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateA !== dateB) {
            return dateB - dateA;
          }
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        })[0];

      // Calcular estado del último buzoneamiento
      let lastMailboxingStatus:
        | "none"
        | "inside_recent"
        | "inside_old"
        | "outside"
        | "no_disturb" = "none";
      let lastMailboxingDate: Date | null = null;

      if (lastMailboxing) {
        lastMailboxingDate = new Date(lastMailboxing.date);
        const daysSinceLastMailboxing = Math.floor(
          (now.getTime() - lastMailboxingDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (lastMailboxing.status === "inside") {
          if (daysSinceLastMailboxing > 30) {
            lastMailboxingStatus = "inside_old"; // Rojo: pasó >1 mes
          } else {
            lastMailboxingStatus = "inside_recent"; // Verde: reciente <1 mes
          }
        } else if (lastMailboxing.status === "outside") {
          lastMailboxingStatus = "outside"; // Naranja: fuera (sin importar días)
        } else if (lastMailboxing.status === "no_disturb") {
          lastMailboxingStatus = "no_disturb"; // Gris: no molestar
        }
      }

      return {
        id: building.id,
        street: building.street,
        number: String(building.number),
        block: building.block || "",
        stair: building.stair || "",
        countOfProperties,
        countOfListingSales,
        countOfListingTenancy,
        countOfFollowUps,
        followUpsRecent,
        followUpsMedium,
        followUpsOld,
        followUpsNone,
        mailboxingInside,
        mailboxingOutside,
        mailboxingNone,
        lastMailboxingStatus,
        lastMailboxingDate: lastMailboxingDate?.toISOString() || null,
      };
    });

    return { data: result, meta: { totalItems, page, limit, totalPages } };
  }
  async getBuildingById(params: GetBuildingByIdParams) {
    const { id } = params;
    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        properties: {
          select: {
            id: true,
            number: true,
            ownerId: true,
            tenantId: true,
            occupiedBy: true,
            appraisalPrice: true,
            soldRentedUs: true,
            noDisturb: true,
            isInformer: true,
            isPresident: true,
            isSecondResidence: true,
            isOpportunity: true,
            status: true, // Agregar campo status
            importantNotice: true, // Agregar campo importantNotice
            listings: {
              include: {
                listingType: true,
              },
            },
            followUps: {
              orderBy: {
                executedDate: "desc",
              },
              take: 1,
              where: {
                deletedAt: null,
              },
              select: {
                executedDate: true,
                deletedAt: true,
              },
            },
          },
        },
        assignments: true,
      },
    });

    if (!building) throw new Error(`Building with ID ${id} not found`);

    type PropertyWithLastFollowUp = Pick<
      Property,
      "id" | "number" | "status"
    > & {
      lastFollowUpDate?: Date | null;
      soldRentedUs?: boolean;
      noDisturb?: boolean;
      importantNotice?: string | null;
      isOpportunity?: boolean;
      appraisalPrice?: number | null;
      listings?: Array<{
        id: number;
        listingType?: { name: string };
      }>;
    };

    const propertiesGroups: Record<string, PropertyWithLastFollowUp[]> = {
      listingsSales: [],
      listingsTenancy: [],
      followUps: [],
      valuation: [], // Mantener para compatibilidad, pero se unificará con opportunitiesAndValuation
      opportunitiesAndValuation: [], // Nueva columna unificada: Oportunidades y Valorados
      tenantOccupied: [],
      ownerOccupied: [],
      secondResidence: [],
      empty: [],
      informer: [],
      president: [],
      noOccupationStatus: [],
    };

    building.properties.forEach((property) => {
      const {
        id,
        number,
        ownerId,
        tenantId,
        occupiedBy,
        appraisalPrice,
        status,
        importantNotice,
      } = property;
      const isInformer = (property as any).isInformer || false;
      const isPresident = (property as any).isPresident || false;
      const isSecondResidence = (property as any).isSecondResidence || false;
      const isOpportunity = (property as any).isOpportunity || false;

      // Obtener la fecha del último seguimiento ejecutado
      const lastFollowUp =
        property.followUps.length > 0 ? property.followUps[0] : null;
      const lastFollowUpDate = lastFollowUp?.executedDate || null;

      const propertyWithDate: PropertyWithLastFollowUp = {
        id,
        number,
        status: status || "sin_estado",
        lastFollowUpDate,
        soldRentedUs: (property as any).soldRentedUs || false,
        noDisturb: (property as any).noDisturb || false,
        importantNotice: importantNotice || null,
        isOpportunity,
        appraisalPrice: appraisalPrice ? Number(appraisalPrice) : null,
        listings: property.listings.map((l) => ({
          id: l.id,
          listingType: l.listingType ? { name: l.listingType.name } : undefined,
        })),
      };

      // Múltiples grupos: una propiedad puede estar en varios

      // 1. Noticia Venta - basado en el status de la propiedad
      if (status === "noticia_venta") {
        propertiesGroups.listingsSales.push(propertyWithDate);
      }

      // 2. Noticia Alquiler - basado en el status de la propiedad
      if (status === "noticia_alquiler") {
        propertiesGroups.listingsTenancy.push(propertyWithDate);
      }

      // 3. Con seguimientos (debe tener al menos un seguimiento activo)
      const hasActiveFollowUps = property.followUps.some(
        (followUp) => followUp.deletedAt === null
      );
      if (hasActiveFollowUps) {
        propertiesGroups.followUps.push(propertyWithDate);
      }

      // 4. Valoración (appraisalPrice no es null) - Mantener para compatibilidad
      if (appraisalPrice !== null) {
        propertiesGroups.valuation.push(propertyWithDate);
      }

      // 4b. Oportunidades y Valorados (unificación de followUps y valuation)
      // Incluir si tiene seguimientos activos O es oportunidad O está valorada
      if (isOpportunity || appraisalPrice !== null) {
        propertiesGroups.opportunitiesAndValuation.push(propertyWithDate);
      }

      // 5. Ocupado por Inquilino (SOLO basado en occupiedBy = "tenant")
      if (occupiedBy === "tenant") {
        propertiesGroups.tenantOccupied.push(propertyWithDate);
      }

      // 6. Ocupado por Propietario (SOLO basado en occupiedBy = "owner")
      if (occupiedBy === "owner") {
        propertiesGroups.ownerOccupied.push(propertyWithDate);
      }

      // 7. Segunda Residencia
      if (isSecondResidence) {
        propertiesGroups.secondResidence.push(propertyWithDate);
      }

      // 8. Vacío (SOLO basado en occupiedBy = "none" o null)
      if (occupiedBy === "none" || occupiedBy === null || occupiedBy === undefined) {
        propertiesGroups.empty.push(propertyWithDate);
      }

      // 9. Informador
      if (isInformer) {
        propertiesGroups.informer.push(propertyWithDate);
      }

      // 10. Presidente
      if (isPresident) {
        propertiesGroups.president.push(propertyWithDate);
      }

      // 11. Sin estado de ocupación (si no encajó en NINGÚN grupo anterior)
      // NO incluir aquí si ya está en "empty", "ownerOccupied", "tenantOccupied"
      const hasActiveFollowUpsForClassification = property.followUps.some(
        (followUp) => followUp.deletedAt === null
      );
      const hasAnyClassification =
        property.listings.length > 0 ||
        hasActiveFollowUpsForClassification ||
        appraisalPrice !== null ||
        occupiedBy === "tenant" ||
        occupiedBy === "owner" ||
        occupiedBy === "none" ||
        isSecondResidence ||
        isInformer ||
        isPresident;

      // Solo agregar a "noOccupationStatus" si NO tiene NINGUNA clasificación previa
      if (!hasAnyClassification) {
        propertiesGroups.noOccupationStatus.push(propertyWithDate);
      }
    });

    return {
      building,
      propertiesGroups,
    };
  }

  async getBuildingMailboxings(
    params: GetBuildingMailboxingsParams,
    query: GetBuildingMailboxingsQuery
  ): Promise<MailboxingListResponse> {
    const { id: buildingId } = params;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    // Verificar que el edificio existe
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new Error("Edificio no encontrado");
    }

    const where: Prisma.MailboxingWhereInput = {
      buildingId,
      deletedAt: null,
    };

    // Aplicar filtros opcionales
    if (query.mailboxerId) {
      where.mailboxerId = query.mailboxerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    const [mailboxings, total] = await Promise.all([
      prisma.mailboxing.findMany({
        where,
        include: {
          mailboxer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          building: {
            select: {
              id: true,
              street: true,
              number: true,
              block: true,
              stair: true,
            },
          },
          attachments: {
            where: {
              deletedAt: null,
            },
            select: {
              id: true,
              mailboxingId: true,
              fileName: true,
              s3Key: true,
              mimeType: true,
              fileSize: true,
              url: true,
              uploadedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.mailboxing.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const s3 = S3StorageService.getInstance();

    // Mapear a DTOs
    const data = await Promise.all(
      mailboxings.map(async (mb) => {
        const attachments =
          mb.attachments && mb.attachments.length > 0
            ? await Promise.all(
                mb.attachments.map(async (attachment) => {
                  const signedUrl = await s3.getSignedUrl(attachment.s3Key);
                  return {
                    id: attachment.id,
                    mailboxingId: attachment.mailboxingId,
                    fileName: attachment.fileName || undefined,
                    mimeType: attachment.mimeType,
                    fileSize: attachment.fileSize,
                    s3Key: attachment.s3Key,
                    url: attachment.url,
                    signedUrl,
                    uploadedBy: attachment.uploadedBy ?? undefined,
                    createdAt: attachment.createdAt,
                    updatedAt: attachment.updatedAt,
                  };
                })
              )
            : [];

        return {
          id: mb.id,
          mailboxerId: mb.mailboxerId,
          mailboxer: mb.mailboxer,
          buildingId: mb.buildingId,
          building: mb.building,
          status: mb.status,
          comment: mb.comment || undefined,
          date: mb.date,
          createdAt: mb.createdAt,
          updatedAt: mb.updatedAt,
          deletedAt: mb.deletedAt || undefined,
          attachments,
        } as MailboxingDTO;
      })
    );

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}

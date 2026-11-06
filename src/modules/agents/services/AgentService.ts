import { prisma } from "@core/lib";
import {
  AgentAssignmentDTO,
  AvailablePropertyDTO,
  PropertyWithFollowUpsDTO,
  AvailablePropertyQueryParams,
  AvailablePropertyListResponse,
} from "../types/agent-types";
import { getNameAndNumberFromStreet } from "../../buildings/utils/getNameAndNumberFromStreet";

class AgentService {
  private buildAssignmentTenantFilter(companyId: number | null) {
    if (!companyId) return {};
    return { user: { companyId }, building: { companyId } };
  }

  private buildPropertyTenantFilter(companyId: number | null) {
    if (!companyId) return {};
    return { companyId };
  }

  // Obtener asignaciones activas del agente
  async getActiveAssignments(userId: number, companyId: number | null): Promise<AgentAssignmentDTO[]> {
    const now = new Date();

    const assignments = await prisma.assignment.findMany({
      where: {
        userId,
        type: "Following",
        deletedAt: null,
        startDate: { lte: now },
        endDate: { gte: now },
        ...this.buildAssignmentTenantFilter(companyId),
      },
      include: {
        building: {
          include: {
            properties: {
              where: {
                deletedAt: null,
              },
              include: {
                _count: {
                  select: {
                    followUps: {
                      where: {
                        deletedAt: null,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return assignments.map((assignment) => ({
      id: assignment.id,
      userId: assignment.userId,
      buildingId: assignment.buildingId,
      type: assignment.type,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      isActive: true,
      building: {
        id: assignment.building.id,
        street: assignment.building.street,
        number: assignment.building.number,
        block: assignment.building.block || undefined,
        stair: assignment.building.stair || undefined,
        properties: assignment.building.properties.map((property) => ({
          id: property.id,
          number: property.number,
          floor: property.floor,
          followUpsCount: property._count.followUps,
        })),
      },
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    }));
  }

  // Obtener historial de asignaciones del agente
  async getAssignmentsHistory(userId: number, companyId: number | null): Promise<AgentAssignmentDTO[]> {
    const assignments = await prisma.assignment.findMany({
      where: {
        userId,
        type: "Following",
        deletedAt: null,
        ...this.buildAssignmentTenantFilter(companyId),
      },
      include: {
        building: {
          include: {
            properties: {
              where: {
                deletedAt: null,
              },
              include: {
                _count: {
                  select: {
                    followUps: {
                      where: {
                        deletedAt: null,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    const now = new Date();

    return assignments.map((assignment) => ({
      id: assignment.id,
      userId: assignment.userId,
      buildingId: assignment.buildingId,
      type: assignment.type,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      isActive: assignment.startDate <= now && assignment.endDate >= now,
      building: {
        id: assignment.building.id,
        street: assignment.building.street,
        number: assignment.building.number,
        block: assignment.building.block || undefined,
        stair: assignment.building.stair || undefined,
        properties: assignment.building.properties.map((property) => ({
          id: property.id,
          number: property.number,
          floor: property.floor,
          followUpsCount: property._count.followUps,
        })),
      },
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    }));
  }

  // Obtener todas las propiedades disponibles (sin filtrado por asignaciones)
  async getAvailableProperties(
    userId: number,
    queryParams: AvailablePropertyQueryParams = {},
    companyId: number | null = null
  ): Promise<AvailablePropertyListResponse> {
    const {
      search,
      page = 1,
      limit = 50, // Límite por defecto más alto para búsqueda
    } = queryParams;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {
      deletedAt: null,
      ...this.buildPropertyTenantFilter(companyId),
    };
    // Agregar filtro de búsqueda si se proporciona
    if (search && search.trim()) {
      console.log("Logging search in service: ", { search });

      // Usar la misma lógica que BuildingService para separar nombre de calle y número
      const { streetString, propertyNumber } = getNameAndNumberFromStreet(
        search.trim()
      );

      console.log("Parsed search: ", { streetString, propertyNumber });

      // Construir filtro para edificios que coincidan con el nombre de calle
      const buildingFilter: any = {
        street: {
          contains: streetString,
          mode: "insensitive" as const,
        },
      };

      // Si hay un número en la búsqueda, filtrar también por número de edificio
      if (propertyNumber !== -1) {
        buildingFilter.number = {
          equals: propertyNumber,
        };
      }

      // Aplicar el filtro de edificio a las propiedades
      where.building = buildingFilter;
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          building: true,
          _count: {
            select: {
              followUps: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
        orderBy: [
          { building: { street: "asc" } },
          { building: { number: "asc" } },
          { floor: "asc" },
          { number: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: properties.map((property) => ({
        id: property.id,
        number: property.number,
        floor: property.floor,
        building: {
          id: property.building.id,
          street: property.building.street,
          number: property.building.number,
          block: property.building.block || undefined,
          stair: property.building.stair || undefined,
        },
        followUpsCount: property._count.followUps,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Obtener historial de seguimientos de una propiedad específica
  async getPropertyFollowUpsHistory(
    propertyId: number,
    userId: number,
    companyId: number | null = null
  ): Promise<PropertyWithFollowUpsDTO> {
    try {
      // Hacer una sola consulta optimizada
      const propertyWithFollowUps = await prisma.property.findFirst({
        where: { id: propertyId, ...this.buildPropertyTenantFilter(companyId) },
        include: {
          building: true,
          followUps: {
            where: {
              deletedAt: null,
              ...(companyId ? { companyId } : {}),
            },
            include: {
              seller: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            // Usar solo createdAt para ordenar, que siempre existe
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!propertyWithFollowUps) {
        throw new Error("Propiedad no encontrada");
      }

      return {
        id: propertyWithFollowUps.id,
        number: propertyWithFollowUps.number,
        floor: propertyWithFollowUps.floor,
        building: {
          id: propertyWithFollowUps.building.id,
          street: propertyWithFollowUps.building.street,
          number: propertyWithFollowUps.building.number,
          block: propertyWithFollowUps.building.block || undefined,
          stair: propertyWithFollowUps.building.stair || undefined,
        },
        followUps: propertyWithFollowUps.followUps.map((followUp) => ({
          id: followUp.id,
          wasContacted: followUp.wasContacted,
          contactType: followUp.contactType || undefined,
          letterType: followUp.letterType || undefined,
          observationType: followUp.observationType || undefined,
          plannedDate: followUp.plannedDate?.toISOString(),
          executedDate: followUp.executedDate?.toISOString(),
          comment: followUp.comment || undefined,
          seller: followUp.seller,
          createdAt: followUp.createdAt.toISOString(),
          updatedAt: followUp.updatedAt.toISOString(),
        })),
      };
    } catch (error) {
      console.error("Error en getPropertyFollowUpsHistory service:", error);
      throw error;
    }
  }
}
const agentService = new AgentService();
export { agentService };

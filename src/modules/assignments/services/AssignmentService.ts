import { prisma } from "@core/lib";
import {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentQueryParams,
  AssignmentDTO,
  AssignmentListResponse,
  AssignmentSummaryDTO,
} from "../types";

class AssignmentService {
  async createAssignment(
    input: CreateAssignmentRequest
  ): Promise<AssignmentDTO> {
    // Si endDate no viene, establecerlo igual a startDate (asignación de un día)
    const endDate = input.endDate ?? input.startDate;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      include: { roles: true },
    });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Verificar que el edificio existe
    const building = await prisma.building.findUnique({
      where: { id: input.buildingId },
    });

    if (!building) {
      throw new Error("Edificio no encontrado");
    }

    // Verificar que no existe una asignación solapada para este usuario y edificio
    // Dos rangos de fechas se solapan si: startDate1 <= endDate2 AND endDate1 >= startDate2
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        userId: input.userId,
        buildingId: input.buildingId,
        deletedAt: null,
        AND: [
          { startDate: { lte: endDate } },
          { endDate: { gte: input.startDate } },
        ],
      },
    });

    if (existingAssignment) {
      throw new Error(
        "Ya existe una asignación activa para este usuario y edificio en el período especificado"
      );
    }

    const newAssignment = await prisma.assignment.create({
      data: {
        userId: input.userId,
        buildingId: input.buildingId,
        type: input.type,
        startDate: input.startDate,
        endDate: endDate,
      },
      include: {
        user: {
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
      },
    });

    return this.mapToDTO(newAssignment);
  }

  async getAssignments(
    query: AssignmentQueryParams
  ): Promise<AssignmentListResponse> {
    console.log("Logging query in service: ", { query });

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {
      deletedAt: null,
    };

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.buildingId) {
      where.buildingId = query.buildingId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.isActive !== undefined) {
      const now = new Date();
      console.log({ now });
      if (query.isActive) {
        where.AND = [{ startDate: { lte: now } }, { endDate: { gte: now } }];
      } else {
        where.OR = [{ startDate: { gt: now } }, { endDate: { lt: now } }];
      }
    }

    if (query.search) {
      where.OR = [
        {
          user: {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          },
        },
        {
          building: {
            OR: [{ street: { contains: query.search, mode: "insensitive" } }],
          },
        },
      ];
    }

    // Construir ordenamiento
    const orderBy: any = {};
    if (query.sortBy === "user.firstName") {
      orderBy.user = { firstName: query.sortOrder };
    } else if (query.sortBy === "building.street") {
      orderBy.building = { street: query.sortOrder };
    } else {
      orderBy[query.sortBy!] = query.sortOrder;
    }

    const [assignments, totalItems] = await Promise.all([
      prisma.assignment.findMany({
        where,
        include: {
          user: {
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
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.assignment.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      status: "success",
      data: assignments.map((assignment) => this.mapToDTO(assignment)),
      metadata: {
        totalItems,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getAssignmentById(id: number): Promise<AssignmentDTO> {
    const assignment = await prisma.assignment.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: {
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
      },
    });

    if (!assignment) {
      throw new Error("Asignación no encontrada");
    }

    return this.mapToDTO(assignment);
  }

  async updateAssignment(
    id: number,
    input: UpdateAssignmentRequest
  ): Promise<AssignmentDTO> {
    // Verificar que la asignación existe
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingAssignment) {
      throw new Error("Asignación no encontrada");
    }

    // Verificar usuario si se está actualizando
    if (input.userId) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });
      if (!user) {
        throw new Error("Usuario no encontrado");
      }
    }

    // Verificar edificio si se está actualizando
    if (input.buildingId) {
      const building = await prisma.building.findUnique({
        where: { id: input.buildingId },
      });
      if (!building) {
        throw new Error("Edificio no encontrado");
      }
    }

    // Verificar conflictos de asignaciones si se están actualizando fechas o usuarios/edificios
    if (input.userId || input.buildingId || input.startDate || input.endDate) {
      const userId = input.userId ?? existingAssignment.userId;
      const buildingId = input.buildingId ?? existingAssignment.buildingId;
      const startDate = input.startDate ?? existingAssignment.startDate;
      // Si endDate no viene pero startDate sí, establecer endDate = startDate
      // Si endDate viene, usarlo; si no viene y startDate tampoco, usar el existente
      const endDate =
        input.endDate ??
        (input.startDate ? input.startDate : existingAssignment.endDate);

      const conflictingAssignment = await prisma.assignment.findFirst({
        where: {
          id: { not: id },
          userId,
          buildingId,
          deletedAt: null,
          AND: [
            { startDate: { lte: endDate } },
            { endDate: { gte: startDate } },
          ],
        },
      });

      if (conflictingAssignment) {
        throw new Error(
          "Ya existe una asignación activa para este usuario y edificio en el período especificado"
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      ...input,
      updatedAt: new Date(),
    };

    // Si startDate viene pero endDate no, establecer endDate = startDate
    if (input.startDate && !input.endDate) {
      updateData.endDate = input.startDate;
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
      include: {
        user: {
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
      },
    });

    return this.mapToDTO(updatedAssignment);
  }

  async deleteAssignment(id: number): Promise<void> {
    const assignment = await prisma.assignment.findUnique({
      where: { id, deletedAt: null },
    });

    if (!assignment) {
      throw new Error("Asignación no encontrada");
    }

    await prisma.assignment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async getAssignmentsByUser(userId: number): Promise<AssignmentDTO[]> {
    const assignments = await prisma.assignment.findMany({
      where: {
        userId,
        deletedAt: null,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        user: {
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
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return assignments.map((assignment) => this.mapToDTO(assignment));
  }

  async getAssignmentsByBuilding(
    buildingId: number,
    activeOnly: boolean = false
  ): Promise<AssignmentDTO[]> {
    const where: any = {
      buildingId,
      deletedAt: null,
    };

    // Si se solicita solo asignaciones activas, agregar filtros de fecha
    if (activeOnly) {
      const now = new Date();
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        user: {
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
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return assignments.map((assignment) => this.mapToDTO(assignment));
  }

  async getAssignmentsSummary(): Promise<AssignmentSummaryDTO[]> {
    const now = new Date();

    // Obtener todas las asignaciones (incluyendo las pasadas para habituales)
    const assignments = await prisma.assignment.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        user: {
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
            properties: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    // Agrupar asignaciones por usuario
    const assignmentsByUser = new Map<number, typeof assignments>();

    assignments.forEach((assignment) => {
      const userId = assignment.userId;
      if (!assignmentsByUser.has(userId)) {
        assignmentsByUser.set(userId, []);
      }
      assignmentsByUser.get(userId)!.push(assignment);
    });

    // Construir el resumen para cada usuario
    const summary: AssignmentSummaryDTO[] = [];

    assignmentsByUser.forEach((userAssignments) => {
      const user = userAssignments[0].user;
      const habitualAssignments: AssignmentSummaryDTO["habitualAssignments"]["assignments"] =
        [];
      const activeAssignments: AssignmentSummaryDTO["activeAssignments"]["assignments"] =
        [];
      const futureAssignments: AssignmentSummaryDTO["futureAssignments"]["assignments"] =
        [];

      userAssignments.forEach((assignment) => {
        const propertiesCount = assignment.building.properties.length;
        const buildingName = this.getBuildingDisplayName(assignment.building);

        const assignmentData = {
          id: assignment.id,
          buildingId: assignment.buildingId,
          buildingName,
          type: assignment.type as "Following" | "Mailboxing",
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          propertiesCount,
        };

        // Clasificar en habituales (pasadas), activas o futuras
        if (assignment.endDate < now) {
          // Habituales: asignaciones pasadas (ya terminaron)
          habitualAssignments.push(assignmentData);
        } else if (assignment.startDate <= now && assignment.endDate >= now) {
          // Activos: asignaciones vigentes en la fecha actual
          activeAssignments.push(assignmentData);
        } else if (assignment.startDate > now) {
          // Futuros: asignaciones que aún no han comenzado
          futureAssignments.push(assignmentData);
        }
      });

      // Calcular totales para habituales (edificios y puertas únicos)
      // Edificios únicos que fueron asignados en el pasado
      const habitualBuildingsSet = new Set(
        habitualAssignments.map((a) => a.buildingId)
      );
      const habitualBuildings = habitualBuildingsSet.size;
      
      // Puertas únicas de los edificios habituales (sin duplicados)
      const habitualPropertiesSet = new Set<number>();
      userAssignments
        .filter((a) => a.endDate < now)
        .forEach((a) => {
          a.building.properties.forEach((p) => {
            habitualPropertiesSet.add(p.id);
          });
        });
      const habitualProperties = habitualPropertiesSet.size;

      // Calcular totales para activos
      const activeBuildings = new Set(
        activeAssignments.map((a) => a.buildingId)
      ).size;
      const activeProperties = activeAssignments.reduce(
        (sum, a) => sum + a.propertiesCount,
        0
      );

      // Calcular totales para futuros
      const futureBuildings = new Set(
        futureAssignments.map((a) => a.buildingId)
      ).size;
      const futureProperties = futureAssignments.reduce(
        (sum, a) => sum + a.propertiesCount,
        0
      );

      summary.push({
        agent: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        habitualAssignments: {
          buildings: habitualBuildings,
          totalProperties: habitualProperties,
          assignments: habitualAssignments,
        },
        activeAssignments: {
          buildings: activeBuildings,
          totalProperties: activeProperties,
          assignments: activeAssignments,
        },
        futureAssignments: {
          buildings: futureBuildings,
          totalProperties: futureProperties,
          assignments: futureAssignments,
        },
      });
    });

    return summary;
  }

  private getBuildingDisplayName(building: {
    street: string;
    number: number;
    block?: string | null;
    stair?: string | null;
  }): string {
    const parts = [building.street, building.number.toString()];
    if (building.block) parts.push(`Bloque ${building.block}`);
    if (building.stair) parts.push(`Escalera ${building.stair}`);
    return parts.join(", ");
  }

  private mapToDTO(assignment: any): AssignmentDTO {
    return {
      id: assignment.id,
      userId: assignment.userId,
      buildingId: assignment.buildingId,
      type: assignment.type,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      user: assignment.user,
      building: assignment.building,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };
  }
}

export const assignmentService = new AssignmentService();

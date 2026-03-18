import { prisma } from "@core/lib";
import {
  FollowUpDTO,
  CreateFollowUpRequest,
  UpdateFollowUpRequest,
  FollowUpQueryParams,
  FollowUpListResponse,
  FollowUpStatsDTO,
  AgentFollowUpStatsDTO,
  DirectorsFollowUpOverviewDTO,
  FollowUpReminderInput,
  ObservationType,
} from "../types";
import {
  CreateReminderRequest,
  ReminderRecurrenceConfig,
} from "@modules/reminders/types";
import { reminderService } from "@modules/reminders/services";
import { notificationService } from "@modules/notifications/services/NotificationService";
import {
  canEditFollowUp,
  canDeleteFollowUp,
} from "../utils/permissions";

class FollowUpService {
  async createFollowUp(
    input: CreateFollowUpRequest,
    sellerId: number
  ): Promise<FollowUpDTO> {
    // Verificar que la propiedad existe
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
      include: {
        building: true,
        propertyPersons: {
          where: { role: 'owner' },
          include: {
            person: true,
          },
        },
      },
    });

    if (!property) {
      throw new Error("Propiedad no encontrada");
    }

    // Si la persona (propietario) no tiene preferencia de notificación y tiene email, establecer a EMAIL
    if (property.propertyPersons && property.propertyPersons.length > 0) {
      for (const pp of property.propertyPersons) {
        const person = pp.person;
        // @ts-ignore
        if (person && person.email && (!person.notificationPreference || person.notificationPreference === 'NONE')) {
          await prisma.person.update({
            where: { id: person.id },
            data: { notificationPreference: 'EMAIL' },
          });
        }
      }
    }

    // Verificación de asignación removida - cualquier persona puede crear seguimientos sobre cualquier propiedad

    // Validar la lógica de negocio según la nueva estructura
    if (input.wasContacted && !input.contactType) {
      throw new Error(
        "El tipo de contacto es requerido cuando wasContacted es true"
      );
    }

    if (input.contactType === "Carta en mano" && !input.letterType) {
      throw new Error(
        "El tipo de carta es requerido cuando contactType es 'Carta en mano'"
      );
    }

    // Si wasContacted es false, no puede tener contactType
    // PERO sí puede tener letterType si observationType es "Carta debajo puerta"
    if (!input.wasContacted && input.contactType) {
      throw new Error(
        "No se puede tener tipo de contacto cuando wasContacted es false"
      );
    }
    
    // Validar que letterType solo se permite en casos específicos cuando wasContacted es false
    if (!input.wasContacted && input.letterType) {
      // letterType solo es válido si observationType es "Carta debajo puerta"
      if (input.observationType !== ObservationType.LETTER_UNDER_DOOR) {
        throw new Error(
          "El tipo de carta solo es válido cuando observationType es 'Carta debajo puerta'"
        );
      }
    }

    if (input.wasContacted && input.observationType) {
      throw new Error(
        "No se puede tener observación cuando wasContacted es true"
      );
    }

    // Validar que no se envíe fecha planificada (ya no se permite)
    if (input.plannedDate) {
      throw new Error(
        "Los seguimientos no pueden ser planificados. Todos los seguimientos se registran como completados."
      );
    }

    // Validar que executedDate no sea una fecha futura
    const executedDate = input.executedDate ? new Date(input.executedDate) : new Date();
    const now = new Date();
    if (executedDate > now) {
      throw new Error(
        "La fecha de ejecución no puede ser futura. El seguimiento se registrará con la fecha actual."
      );
    }

    const followUp = await prisma.followUp.create({
      data: {
        sellerId,
        propertyId: input.propertyId,
        wasContacted: input.wasContacted,
        contactType: input.contactType || null,
        letterType: input.letterType || null,
        observationType: input.observationType || null,
        plannedDate: null, // Siempre null - no se permiten seguimientos planificados
        executedDate: executedDate, // Siempre la fecha actual o la proporcionada (si no es futura)
        comment: input.comment,
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
        property: {
          include: {
            building: true,
          },
        },
      },
    });

    await this.syncReminderWithFollowUp({
      followUp,
      sellerId,
      reminderInput: input.reminder,
    });

    // Notificar al propietario si fue una visita (wasContacted = true)
    if (followUp.wasContacted) {
      notificationService.notifyPropertyVisit(followUp.id).catch((err: Error) => {
        console.error("Error enviando notificación al propietario:", err);
      });
    }

    return this.mapToDTO(followUp);
  }

  async getFollowUpById(id: number, userId: number): Promise<FollowUpDTO> {
    // Verificar si el usuario es director
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const isDirector = user?.roles.some((ur) => ur.role.name === "Director");

    // Construir la condición where según el rol del usuario
    const whereCondition: any = {
      id,
      deletedAt: null, // Excluir seguimientos eliminados
    };

    // Si no es director, solo puede ver sus propios seguimientos
    if (!isDirector) {
      whereCondition.sellerId = userId;
    }

    const followUp = await prisma.followUp.findFirst({
      where: whereCondition,
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        property: {
          include: {
            building: true,
          },
        },
      },
    });

    if (!followUp) {
      throw new Error("Seguimiento no encontrado");
    }

    return this.mapToDTO(followUp);
  }

  async getFollowUps(
    params: FollowUpQueryParams,
    userId: number
  ): Promise<FollowUpListResponse> {
    const {
      page: rawPage = 1,
      limit: rawLimit = 10,
      sellerId,
      propertyId,
      wasContacted,
      contactType,
      observationType,
      plannedDateFrom,
      plannedDateTo,
      executedDateFrom,
      executedDateTo,
      search,
      sortBy,
      sortOrder,
    } = params;

    const page = typeof rawPage === "string" ? parseInt(rawPage) : rawPage;
    const limit = typeof rawLimit === "string" ? parseInt(rawLimit) : rawLimit;
    const offset = (page - 1) * limit;

    // Construir filtros
    const where: any = {
      deletedAt: null, // Excluir seguimientos eliminados
    };

    // Si no es director, solo puede ver sus propios seguimientos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const isDirector = user?.roles.some((ur) => ur.role.name === "Director");

    if (!isDirector) {
      where.sellerId = userId;
    } else if (sellerId) {
      where.sellerId =
        typeof sellerId === "string" ? parseInt(sellerId) : sellerId;
    }

    if (propertyId) {
      where.propertyId =
        typeof propertyId === "string" ? parseInt(propertyId) : propertyId;
    }

    // Nuevos filtros del sistema refactorizado
    if (wasContacted !== undefined) {
      where.wasContacted = typeof wasContacted === 'string' 
        ? wasContacted === 'true' 
        : wasContacted;
    }
    if (contactType) {
      where.contactType = contactType;
    }
    if (observationType) {
      where.observationType = observationType;
    }

    // Filtros por fechas planificadas y ejecutadas
    if (plannedDateFrom || plannedDateTo) {
      where.plannedDate = {};
      if (plannedDateFrom) {
        where.plannedDate.gte = new Date(plannedDateFrom);
      }
      if (plannedDateTo) {
        where.plannedDate.lte = new Date(plannedDateTo);
      }
    }

    if (executedDateFrom || executedDateTo) {
      where.executedDate = {};
      if (executedDateFrom) {
        where.executedDate.gte = new Date(executedDateFrom);
      }
      if (executedDateTo) {
        where.executedDate.lte = new Date(executedDateTo);
      }
    }

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: "insensitive" } },
        { seller: { firstName: { contains: search, mode: "insensitive" } } },
        { seller: { lastName: { contains: search, mode: "insensitive" } } },
        { property: { number: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [followUps, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          property: {
            include: {
              building: true,
            },
          },
        },
        orderBy: this.buildOrderBy(sortBy, sortOrder),
        skip: offset,
        take: limit,
      }),
      prisma.followUp.count({ where }),
    ]);

    return {
      data: followUps.map((followUp) => this.mapToDTO(followUp)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateFollowUp(
    id: number,
    input: UpdateFollowUpRequest,
    userId: number
  ): Promise<FollowUpDTO> {
    // Verificar permisos usando el sistema flexible
    const hasPermission = await canEditFollowUp(id, userId);
    if (!hasPermission) {
      throw new Error(
        "Seguimiento no encontrado o no tienes permisos para modificarlo"
      );
    }

    const followUp = await prisma.followUp.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!followUp) {
      throw new Error("Seguimiento no encontrado");
    }

    // Validar la lógica de negocio según la nueva estructura
    if (
      input.wasContacted !== undefined &&
      input.wasContacted &&
      !input.contactType
    ) {
      throw new Error(
        "El tipo de contacto es requerido cuando wasContacted es true"
      );
    }

    if (input.contactType === "Carta en mano" && !input.letterType) {
      throw new Error(
        "El tipo de carta es requerido cuando contactType es 'Carta en mano'"
      );
    }

    const updatedFollowUp = await prisma.followUp.update({
      where: { id },
      data: {
        ...input,
        plannedDate: input.plannedDate
          ? new Date(input.plannedDate)
          : input.plannedDate,
        executedDate: input.executedDate
          ? new Date(input.executedDate)
          : input.executedDate,
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
        property: {
          include: {
            building: true,
          },
        },
      },
    });

    await this.syncReminderWithFollowUp({
      followUp: updatedFollowUp,
      sellerId: userId,
      reminderInput: input.reminder,
    });

    return this.mapToDTO(updatedFollowUp);
  }

  async deleteFollowUp(id: number, userId: number): Promise<void> {
    // Verificar permisos usando el sistema flexible
    const hasPermission = await canDeleteFollowUp(id, userId);
    if (!hasPermission) {
      throw new Error(
        "Seguimiento no encontrado o no tienes permisos para eliminarlo"
      );
    }

    const followUp = await prisma.followUp.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!followUp) {
      throw new Error("Seguimiento no encontrado");
    }

    await prisma.followUp.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    await prisma.reminder.updateMany({
      where: {
        followUpId: id,
        deletedAt: null,
      },
      data: {
        status: "archived",
        deletedAt: new Date(),
      },
    });

    await prisma.reminderOccurrence.updateMany({
      where: {
        followUpId: id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async getFollowUpStats(userId: number): Promise<FollowUpStatsDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const isDirector = user?.roles.some((ur) => ur.role.name === "Director");
    const sellerFilter = isDirector
      ? { deletedAt: null }
      : { sellerId: userId, deletedAt: null };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalFollowUps,
      followUpsThisMonth,
      followUpsContacted,
      followUpsNotContacted,
      followUpsByContactType,
      followUpsByObservationType,
      followUpsPlanned,
      followUpsCompleted,
    ] = await Promise.all([
      prisma.followUp.count({ where: sellerFilter }),
      prisma.followUp.count({
        where: {
          ...sellerFilter,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.followUp.count({
        where: { ...sellerFilter, wasContacted: true },
      }),
      prisma.followUp.count({
        where: { ...sellerFilter, wasContacted: false },
      }),
      prisma.followUp.groupBy({
        by: ["contactType"],
        where: { ...sellerFilter, contactType: { not: null } },
        _count: { contactType: true },
      }),
      prisma.followUp.groupBy({
        by: ["observationType"],
        where: { ...sellerFilter, observationType: { not: null } },
        _count: { observationType: true },
      }),
      prisma.followUp.count({
        where: { ...sellerFilter, plannedDate: { not: null } },
      }),
      prisma.followUp.count({
        where: { ...sellerFilter, executedDate: { not: null } },
      }),
    ]);

    return {
      totalFollowUps,
      followUpsThisMonth,
      followUpsContacted,
      followUpsNotContacted,
      followUpsByContactType: followUpsByContactType.map((item) => ({
        contactType: item.contactType as any,
        count: item._count.contactType,
      })),
      followUpsByObservationType: followUpsByObservationType.map((item) => ({
        observationType: item.observationType as any,
        count: item._count.observationType,
      })),
      followUpsPlanned,
      followUpsCompleted,
    };
  }

  async getDirectorsFollowUpOverview(
    userId: number
  ): Promise<DirectorsFollowUpOverviewDTO> {
    // Verificar que el usuario es director
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const isDirector = user?.roles.some((ur) => ur.role.name === "Director");
    if (!isDirector) {
      throw new Error("Acceso denegado: se requieren permisos de director");
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Obtener todos los agentes
    const agents = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { name: "Agent" },
          },
        },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Obtener estadísticas para cada agente
    const agentsStats = await Promise.all(
      agents.map(async (agent) => {
        const [
          totalFollowUps,
          followUpsThisMonth,
          followUpsContacted,
          followUpsNotContacted,
          followUpsByContactType,
          followUpsByObservationType,
          followUpsPlanned,
          followUpsCompleted,
        ] = await Promise.all([
          prisma.followUp.count({
            where: { sellerId: agent.id, deletedAt: null },
          }),
          prisma.followUp.count({
            where: {
              sellerId: agent.id,
              deletedAt: null,
              createdAt: { gte: startOfMonth },
            },
          }),
          prisma.followUp.count({
            where: { sellerId: agent.id, deletedAt: null, wasContacted: true },
          }),
          prisma.followUp.count({
            where: { sellerId: agent.id, deletedAt: null, wasContacted: false },
          }),
          prisma.followUp.groupBy({
            by: ["contactType"],
            where: {
              sellerId: agent.id,
              deletedAt: null,
              contactType: { not: null },
            },
            _count: { contactType: true },
          }),
          prisma.followUp.groupBy({
            by: ["observationType"],
            where: {
              sellerId: agent.id,
              deletedAt: null,
              observationType: { not: null },
            },
            _count: { observationType: true },
          }),
          prisma.followUp.count({
            where: {
              sellerId: agent.id,
              deletedAt: null,
              plannedDate: { not: null },
            },
          }),
          prisma.followUp.count({
            where: {
              sellerId: agent.id,
              deletedAt: null,
              executedDate: { not: null },
            },
          }),
        ]);

        return {
          agent,
          totalFollowUps,
          followUpsThisMonth,
          followUpsContacted,
          followUpsNotContacted,
          followUpsByContactType: followUpsByContactType.map((item) => ({
            contactType: item.contactType as any,
            count: item._count.contactType,
          })),
          followUpsByObservationType: followUpsByObservationType.map(
            (item) => ({
              observationType: item.observationType as any,
              count: item._count.observationType,
            })
          ),
          followUpsPlanned,
          followUpsCompleted,
        };
      })
    );

    const totalFollowUps = agentsStats.reduce(
      (sum, agent) => sum + agent.totalFollowUps,
      0
    );
    const followUpsThisMonth = agentsStats.reduce(
      (sum, agent) => sum + agent.followUpsThisMonth,
      0
    );

    return {
      totalAgents: agents.length,
      totalFollowUps,
      followUpsThisMonth,
      agentsStats,
    };
  }

  async completeFollowUp(id: number, userId: number): Promise<FollowUpDTO> {
    const followUp = await prisma.followUp.findFirst({
      where: {
        id,
        sellerId: userId,
        deletedAt: null,
      },
    });

    if (!followUp) {
      throw new Error(
        "Seguimiento no encontrado o no tienes permisos para modificarlo"
      );
    }

    const updatedFollowUp = await prisma.followUp.update({
      where: { id },
      data: {
        executedDate: new Date(),
        plannedDate: null, // Limpiar fecha planificada al marcar como ejecutado
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
        property: {
          include: {
            building: true,
          },
        },
      },
    });

    await prisma.reminderOccurrence.updateMany({
      where: {
        followUpId: id,
        status: "pending",
        deletedAt: null,
      },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    await this.syncReminderWithFollowUp({
      followUp: updatedFollowUp,
      sellerId: userId,
      reminderInput: { create: false },
    });

    return this.mapToDTO(updatedFollowUp);
  }

  async getPlanned(userId?: number): Promise<FollowUpDTO[]> {
    const where: any = {
      deletedAt: null,
      plannedDate: { not: null },
    };

    if (userId) {
      where.sellerId = userId;
    }

    const followUps = await prisma.followUp.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        property: {
          include: {
            building: true,
          },
        },
      },
      orderBy: {
        plannedDate: "asc",
      },
    });

    return followUps.map((followUp) => this.mapToDTO(followUp));
  }

  async getCompleted(userId?: number): Promise<FollowUpDTO[]> {
    const where: any = {
      deletedAt: null,
      executedDate: { not: null },
    };

    if (userId) {
      where.sellerId = userId;
    }

    const followUps = await prisma.followUp.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        property: {
          include: {
            building: true,
          },
        },
      },
      orderBy: {
        executedDate: "desc",
      },
    });

    return followUps.map((followUp) => this.mapToDTO(followUp));
  }

  private buildOrderBy(
    sortBy?: string,
    sortOrder?: "asc" | "desc"
  ): any[] {
    const order = sortOrder || "desc";

    if (!sortBy) {
      // Orden por defecto
      return [
        { executedDate: "desc" },
        { plannedDate: "desc" },
        { createdAt: "desc" },
      ];
    }

    // Mapeo de campos de ordenamiento
    const orderByMap: Record<string, any> = {
      executedDate: { executedDate: order },
      plannedDate: { plannedDate: order },
      createdAt: { createdAt: order },
      wasContacted: { wasContacted: order },
      sellerId: { sellerId: order },
      contactType: { contactType: order },
      observationType: { observationType: order },
    };

    const primaryOrder = orderByMap[sortBy];
    if (!primaryOrder) {
      // Si el campo no es válido, usar orden por defecto
      return [
        { executedDate: "desc" },
        { plannedDate: "desc" },
        { createdAt: "desc" },
      ];
    }

    // Agregar orden secundario para consistencia
    return [
      primaryOrder,
      { createdAt: "desc" },
    ];
  }

  private mapToDTO(followUp: any): FollowUpDTO {
    return {
      id: followUp.id,
      sellerId: followUp.sellerId,
      seller: followUp.seller,
      propertyId: followUp.propertyId,
      property: followUp.property,
      wasContacted: followUp.wasContacted,
      contactType: followUp.contactType,
      letterType: followUp.letterType,
      observationType: followUp.observationType,
      plannedDate: followUp.plannedDate,
      executedDate: followUp.executedDate,
      comment: followUp.comment,
      createdAt: followUp.createdAt,
      updatedAt: followUp.updatedAt,
    };
  }

  private async syncReminderWithFollowUp({
    followUp,
    sellerId,
    reminderInput,
  }: {
    followUp: any;
    sellerId: number;
    reminderInput?: FollowUpReminderInput | null;
  }) {
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        followUpId: followUp.id,
        deletedAt: null,
        status: { not: "archived" },
      },
      orderBy: { createdAt: "desc" },
    });

    const hasPlannedDate = !!followUp.plannedDate;
    const shouldCreate =
      reminderInput?.create !== false && (reminderInput || hasPlannedDate);

    if (!shouldCreate) {
      if (existingReminder) {
        await reminderService.changeStatus(
          existingReminder.id,
          "cancelled",
          sellerId
        );
      }
      return;
    }

    const plannedDateIso = followUp.plannedDate
      ? new Date(followUp.plannedDate).toISOString()
      : undefined;

    const scheduledAtIso =
      reminderInput?.scheduledAt ?? plannedDateIso ?? undefined;

    if (!scheduledAtIso) {
      if (existingReminder) {
        await reminderService.changeStatus(
          existingReminder.id,
          "paused",
          sellerId
        );
      }
      return;
    }

    const recurrence: ReminderRecurrenceConfig =
      reminderInput?.recurrence ?? { type: "once" };

    const createPayload: CreateReminderRequest = {
      title:
        reminderInput?.title ??
        this.buildDefaultReminderTitle(followUp.property),
      note: reminderInput?.note ?? followUp.comment ?? undefined,
      responsibleId: reminderInput?.responsibleId ?? sellerId,
      propertyId: followUp.propertyId,
      personId: undefined,
      followUpId: followUp.id,
      scheduledAt: scheduledAtIso,
      timezone: reminderInput?.timezone,
      recurrence,
      metadata: {
        origin: "followup",
        followUpId: followUp.id,
      },
    };

    if (existingReminder) {
      const existingMetadata =
        (existingReminder.metadata ?? {}) as Record<string, unknown>;
      await reminderService.updateReminder(
        existingReminder.id,
        {
          title: createPayload.title,
          note: createPayload.note,
          responsibleId: createPayload.responsibleId,
          propertyId: createPayload.propertyId,
          followUpId: followUp.id,
          scheduledAt: createPayload.scheduledAt,
          timezone: createPayload.timezone,
          recurrence: createPayload.recurrence,
          metadata: {
            ...existingMetadata,
            origin: "followup",
            followUpId: followUp.id,
          },
          status: "active",
        },
        sellerId
      );
    } else {
      await reminderService.createReminder(createPayload, sellerId);
    }
  }

  private buildDefaultReminderTitle(property: any): string {
    if (!property) {
      return "Recordatorio de seguimiento";
    }
    const building = property.building;
    const buildingLabel = building
      ? `${building.street ?? "Edificio"} ${building.number ?? ""}`.trim()
      : "Propiedad";
    return `Seguimiento - ${buildingLabel} puerta ${property.number ?? ""}`.trim();
  }
}

export default new FollowUpService();

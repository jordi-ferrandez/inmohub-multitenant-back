import { prisma } from "@core/lib";
import { DateTime } from "luxon";
import { RRule, Weekday, rrulestr } from "rrule";
import type { Options as RRuleOptions } from "rrule/dist/esm/types";
import {
  AgendaQueryParams,
  AgendaResponse,
  CreateReminderRequest,
  ReminderDTO,
  ReminderListResponse,
  ReminderOccurrenceDTO,
  ReminderQueryParams,
  ReminderRecurrenceConfig,
  ReminderRecurrenceType,
  ReminderStatus,
  UpdateOccurrenceStatusRequest,
  UpdateReminderRequest,
} from "../types";
import { canEditReminder, canDeleteReminder } from "../utils/permissions";
import type {
  Reminder as PrismaReminderModel,
  ReminderOccurrence as PrismaReminderOccurrenceModel,
  Prisma,
  $Enums,
} from "./../../../../generated/prisma";

const DEFAULT_TIMEZONE = "Europe/Madrid";

const WEEKDAY_MAP: Record<number, Weekday> = {
  0: RRule.SU,
  1: RRule.MO,
  2: RRule.TU,
  3: RRule.WE,
  4: RRule.TH,
  5: RRule.FR,
  6: RRule.SA,
};

class ReminderService {
  async createReminder(
    input: CreateReminderRequest,
    creatorId: number
  ): Promise<ReminderDTO> {
    const timezone = input.timezone || DEFAULT_TIMEZONE;
    const scheduledAt = this.isoToUtc(input.scheduledAt, timezone);

    const recurrenceData = this.buildRecurrenceData(
      input.recurrence,
      scheduledAt,
      timezone
    );

    const metadataCombined =
      input.metadata || recurrenceData.metadata
        ? {
            ...(recurrenceData.metadata ?? {}),
            ...(input.metadata ?? {}),
          }
        : undefined;

    // Si se envía propertyId pero no buildingId, calcular buildingId desde la propiedad
    let buildingId = input.buildingId || null;
    if (input.propertyId && !buildingId) {
      const property = await prisma.property.findUnique({
        where: { id: input.propertyId },
        select: { buildingId: true },
      });
      if (property) {
        buildingId = property.buildingId;
      }
    }

    const reminder = await prisma.reminder.create({
      data: {
        title: input.title,
        note: input.note || null,
        responsibleId: input.responsibleId,
        creatorId,
        propertyId: input.propertyId || null,
        buildingId,
        personId: input.personId || null,
        followUpId: input.followUpId || null,
        scheduledAt,
        timezone,
        recurrenceType: recurrenceData.type,
        recurrenceRule: recurrenceData.rule,
        recurrenceEndsAt: recurrenceData.endsAt || null,
        status: "active",
        metadata: this.toJsonValue(metadataCombined),
      },
      include: this.defaultInclude(),
    });

    await this.ensureOccurrencesForRange(
      reminder,
      DateTime.fromJSDate(scheduledAt).minus({ days: 1 }),
      DateTime.fromJSDate(scheduledAt).plus({ days: 30 })
    );

    return this.mapReminderToDTO(reminder);
  }

  async getReminders(
    params: ReminderQueryParams,
    requesterId: number
  ): Promise<ReminderListResponse> {
    const page = params.page ? parseInt(params.page, 10) : 1;
    const limit = params.limit ? parseInt(params.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      include: { roles: { include: { role: true } } },
    });

    const isDirector = requester?.roles.some(
      (ur) => ur.role.name === "Director"
    );

    // Guardar el OR de permisos si existe (para no-directores)
    const permissionOR = !isDirector
      ? [{ responsibleId: requesterId }, { creatorId: requesterId }]
      : null;

    if (params.responsibleId) {
      where.responsibleId = parseInt(params.responsibleId, 10);
    }

    if (params.status) {
      const statuses = params.status.split(",") as ReminderStatus[];
      where.status = { in: statuses };
    }

    if (params.propertyId) {
      where.propertyId = parseInt(params.propertyId, 10);
    }

    if (params.buildingId) {
      const buildingIdNum = parseInt(params.buildingId, 10);
      // Incluir recordatorios que:
      // 1. Tienen buildingId directamente asignado, O
      // 2. Están asociados a una propiedad que pertenece a este edificio
      const buildingOR = [
        { buildingId: buildingIdNum },
        {
          property: {
            buildingId: buildingIdNum,
          },
        },
      ];

      // Si hay un OR de permisos previo, combinarlo con AND
      if (permissionOR) {
        where.AND = [
          { OR: permissionOR },
          { OR: buildingOR },
        ];
      } else {
        // Si no hay OR de permisos, usar directamente el OR del building
        where.OR = buildingOR;
      }
    } else if (permissionOR) {
      // Si no hay buildingId pero hay permisos, usar el OR de permisos
      where.OR = permissionOR;
    }

    if (params.personId) {
      where.personId = parseInt(params.personId, 10);
    }

    if (params.followUpId) {
      where.followUpId = parseInt(params.followUpId, 10);
    }

    if (params.search) {
      const searchOR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { note: { contains: params.search, mode: "insensitive" } },
      ];

      // Si ya hay un AND (por combinación de permisos y buildingId), agregar search al AND
      if (where.AND) {
        where.AND.push({ OR: searchOR });
      } else if (where.OR) {
        // Si hay un OR previo (permisos o buildingId), combinarlo con AND
        const existingOR = where.OR;
        where.AND = [
          { OR: existingOR },
          { OR: searchOR },
        ];
        delete where.OR;
      } else {
        // Si no hay OR previo, usar directamente
        where.OR = searchOR;
      }
    }

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        include: this.defaultInclude(),
        orderBy: this.buildOrderBy(params.sortBy, params.sortOrder),
        skip,
        take: limit,
      }),
      prisma.reminder.count({ where }),
    ]);

    return {
      data: reminders.map((reminder) => this.mapReminderToDTO(reminder)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReminderById(
    id: number,
    requesterId: number
  ): Promise<ReminderDTO> {
    const reminder = await prisma.reminder.findFirst({
      where: { id, deletedAt: null },
      include: this.defaultInclude(),
    });

    if (!reminder) {
      throw new Error("Recordatorio no encontrado");
    }

    await this.ensureAccess(reminder, requesterId);

    return this.mapReminderToDTO(reminder);
  }

  async updateReminder(
    id: number,
    input: UpdateReminderRequest,
    requesterId: number
  ): Promise<ReminderDTO> {
    // Verificar permisos usando el sistema flexible
    const hasPermission = await canEditReminder(id, requesterId);
    if (!hasPermission) {
      throw new Error(
        "Recordatorio no encontrado o no tienes permisos para editarlo"
      );
    }

    const reminder = await prisma.reminder.findFirst({
      where: { id, deletedAt: null },
    });

    if (!reminder) {
      throw new Error("Recordatorio no encontrado");
    }

    let scheduledAt = reminder.scheduledAt;
    let timezone = reminder.timezone;
    if (input.timezone) {
      timezone = input.timezone;
    }
    if (input.scheduledAt) {
      scheduledAt = this.isoToUtc(input.scheduledAt, timezone);
    }

    let recurrenceData: {
      rule: string | null;
      type: ReminderRecurrenceType;
      endsAt: Date | null;
      metadata: Record<string, unknown> | null;
    } | null = null;

    if (input.recurrence) {
      recurrenceData = this.buildRecurrenceData(
        input.recurrence,
        scheduledAt,
        timezone
      );
    }

    // Si se envía propertyId pero no buildingId, calcular buildingId desde la propiedad
    let buildingId = input.buildingId;
    if (input.propertyId !== undefined && buildingId === undefined) {
      const property = await prisma.property.findUnique({
        where: { id: input.propertyId },
        select: { buildingId: true },
      });
      if (property) {
        buildingId = property.buildingId;
      }
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        title: input.title ?? undefined,
        note: input.note !== undefined ? input.note : undefined,
        responsibleId: input.responsibleId ?? undefined,
        propertyId:
          input.propertyId !== undefined ? input.propertyId : undefined,
        buildingId: buildingId !== undefined ? buildingId : undefined,
        personId: input.personId !== undefined ? input.personId : undefined,
        followUpId:
          input.followUpId !== undefined ? input.followUpId : undefined,
        scheduledAt,
        timezone,
        recurrenceType: recurrenceData ? recurrenceData.type : undefined,
        recurrenceRule: recurrenceData ? recurrenceData.rule : undefined,
        recurrenceEndsAt: recurrenceData ? recurrenceData.endsAt : undefined,
        metadata:
          input.metadata !== undefined
            ? this.toJsonValue(input.metadata)
            : recurrenceData
            ? this.toJsonValue(recurrenceData.metadata)
            : undefined,
        status: input.status ?? undefined,
      },
      include: this.defaultInclude(),
    });

    if (recurrenceData) {
      await prisma.reminderOccurrence.deleteMany({
        where: {
          reminderId: id,
          status: "pending",
        },
      });
    }

    await this.ensureOccurrencesForRange(
      updated,
      DateTime.now().minus({ days: 1 }),
      DateTime.now().plus({ days: 60 })
    );

    return this.mapReminderToDTO(updated);
  }

  async changeStatus(
    id: number,
    status: ReminderStatus,
    requesterId: number
  ): Promise<ReminderDTO> {
    const reminder = await prisma.reminder.findFirst({
      where: { id, deletedAt: null },
      include: this.defaultInclude(),
    });

    if (!reminder) {
      throw new Error("Recordatorio no encontrado");
    }

    await this.ensureAccess(reminder, requesterId);

    const updated = await prisma.reminder.update({
      where: { id },
      data: { status },
      include: this.defaultInclude(),
    });

    return this.mapReminderToDTO(updated);
  }

  async getAgenda(
    params: AgendaQueryParams,
    requesterId: number
  ): Promise<AgendaResponse> {
    const start = DateTime.fromISO(params.start, { zone: "utc" }).toJSDate();
    const end = DateTime.fromISO(params.end, { zone: "utc" }).toJSDate();

    const responsibleId = params.responsibleId
      ? parseInt(params.responsibleId, 10)
      : undefined;

    const user = await prisma.user.findUnique({
      where: { id: requesterId },
      include: { roles: { include: { role: true } } },
    });

    const isDirector = user?.roles.some(
      (ur) => ur.role.name === "Director"
    );

    const whereReminder: any = {
      deletedAt: null,
      status: { notIn: ["cancelled", "archived"] },
    };

    if (responsibleId) {
      whereReminder.responsibleId = responsibleId;
    } else if (!isDirector) {
      whereReminder.responsibleId = requesterId;
    }

    const reminders = await prisma.reminder.findMany({
      where: whereReminder,
      include: this.defaultInclude(),
    });

    const occurrences: ReminderOccurrenceDTO[] = [];

    for (const reminder of reminders) {
      const ensured = await this.ensureOccurrencesForRange(
        reminder,
        DateTime.fromJSDate(start),
        DateTime.fromJSDate(end),
        true
      );

      for (const occ of ensured) {
        if (
          occ.scheduledFor >= start &&
          occ.scheduledFor <= end &&
          (params.includeCompleted === "true" || occ.status === "pending")
        ) {
          occurrences.push(this.mapOccurrenceToDTO(occ));
        }
      }
    }

    const sorted = occurrences.sort(
      (a, b) =>
        new Date(a.scheduledFor).getTime() -
        new Date(b.scheduledFor).getTime()
    );

    return {
      data: sorted,
      meta: {
        start: params.start,
        end: params.end,
        responsibleId,
      },
    };
  }

  async getOccurrencesByReminder(
    reminderId: number,
    requesterId: number
  ): Promise<ReminderOccurrenceDTO[]> {
    const reminder = await prisma.reminder.findFirst({
      where: { id: reminderId, deletedAt: null },
    });

    if (!reminder) {
      throw new Error("Recordatorio no encontrado");
    }

    await this.ensureAccess(reminder, requesterId);

    const occurrences = await prisma.reminderOccurrence.findMany({
      where: { reminderId, deletedAt: null },
      orderBy: [{ scheduledFor: "asc" }],
      include: {
        reminder: {
          include: this.defaultInclude(),
        },
      },
    });

    return occurrences.map((occ) => this.mapOccurrenceToDTO(occ));
  }

  async updateOccurrenceStatus(
    reminderId: number,
    occurrenceId: number,
    input: UpdateOccurrenceStatusRequest,
    requesterId: number
  ): Promise<ReminderOccurrenceDTO> {
    const reminder = await prisma.reminder.findFirst({
      where: { id: reminderId, deletedAt: null },
    });

    if (!reminder) {
      throw new Error("Recordatorio no encontrado");
    }

    await this.ensureAccess(reminder, requesterId);

    const occurrence = await prisma.reminderOccurrence.findFirst({
      where: { id: occurrenceId, reminderId, deletedAt: null },
    });

    if (!occurrence) {
      throw new Error("Ocurrencia no encontrada");
    }

    const timezone = occurrence.timezone || reminder.timezone;

    const scheduledFor =
      input.scheduledFor !== undefined
        ? this.isoToUtc(input.scheduledFor, timezone)
        : occurrence.scheduledFor;

    // Preparar metadata con actionNote si se proporciona
    let updatedMetadata: any = input.metadata !== undefined
      ? input.metadata
      : occurrence.metadata;

    // Si se proporciona actionNote, agregarlo al metadata
    if (input.actionNote && input.actionNote.trim().length > 0) {
      const currentMetadata = (updatedMetadata as Record<string, unknown>) || {};
      const actionNotes = Array.isArray(currentMetadata.actionNotes)
        ? (currentMetadata.actionNotes as Array<unknown>)
        : [];
      
      actionNotes.push({
        action: input.status,
        note: input.actionNote.trim(),
        date: new Date().toISOString(),
      });

      updatedMetadata = {
        ...currentMetadata,
        actionNotes,
      };
    }

    const updated = await prisma.reminderOccurrence.update({
      where: { id: occurrenceId },
      data: {
        status: input.status,
        scheduledFor,
        followUpId:
          input.followUpId !== undefined ? input.followUpId : undefined,
        completedAt: input.completedAt
          ? new Date(input.completedAt)
          : input.status === "completed"
          ? new Date()
          : occurrence.completedAt,
        skippedAt: input.skippedAt
          ? new Date(input.skippedAt)
          : input.status === "skipped"
          ? new Date()
          : occurrence.skippedAt,
        skippedReason:
          input.skippedReason !== undefined
            ? input.skippedReason
            : occurrence.skippedReason,
        metadata: this.toJsonValue(updatedMetadata),
      },
      include: {
        reminder: {
          include: this.defaultInclude(),
        },
      },
    });

    if (
      reminder.status === "active" &&
      (input.status === "completed" || input.status === "skipped")
    ) {
      await this.ensureOccurrencesForRange(
        reminder,
        DateTime.fromJSDate(updated.scheduledFor),
        DateTime.fromJSDate(updated.scheduledFor).plus({ days: 30 })
      );
    }

    return this.mapOccurrenceToDTO(updated);
  }

  async deleteReminder(id: number, requesterId: number): Promise<void> {
    // Verificar permisos usando el sistema flexible
    const hasPermission = await canDeleteReminder(id, requesterId);
    if (!hasPermission) {
      throw new Error(
        "Recordatorio no encontrado o no tienes permisos para eliminarlo"
      );
    }

    const reminder = await prisma.reminder.findFirst({
      where: { id, deletedAt: null },
    });

    if (!reminder) {
      throw new Error("Recordatorio no encontrado");
    }

    await prisma.$transaction([
      prisma.reminderOccurrence.updateMany({
        where: { reminderId: id },
        data: { deletedAt: new Date() },
      }),
      prisma.reminder.update({
        where: { id },
        data: { deletedAt: new Date(), status: "archived" },
      }),
    ]);
  }

  private buildOrderBy(
    sortBy?: string,
    sortOrder?: "asc" | "desc"
  ): any[] {
    const order = sortOrder || "asc";

    if (!sortBy) {
      // Orden por defecto
      return [
        { status: "asc" },
        { scheduledAt: "asc" },
        { updatedAt: "desc" },
      ];
    }

    // Mapeo de campos de ordenamiento
    const orderByMap: Record<string, any> = {
      scheduledAt: { scheduledAt: order },
      status: { status: order },
      createdAt: { createdAt: order },
      updatedAt: { updatedAt: order },
      responsibleId: { responsibleId: order },
      title: { title: order },
    };

    const primaryOrder = orderByMap[sortBy];
    if (!primaryOrder) {
      // Si el campo no es válido, usar orden por defecto
      return [
        { status: "asc" },
        { scheduledAt: "asc" },
        { updatedAt: "desc" },
      ];
    }

    // Agregar orden secundario para consistencia
    return [
      primaryOrder,
      { updatedAt: "desc" },
    ];
  }

  private defaultInclude(): any {
    return {
      responsible: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      property: {
        select: {
          id: true,
          number: true,
          floor: true,
          buildingId: true,
          building: {
            select: {
              id: true,
              street: true,
              number: true,
            },
          },
          propertyPersons: {
            where: {
              deletedAt: null,
            },
            select: {
              id: true,
              role: true,
              person: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phones: {
                    where: {
                      deletedAt: null,
                    },
                    select: {
                      id: true,
                      phone: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
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
      person: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phones: {
            where: {
              deletedAt: null,
            },
            select: {
              id: true,
              phone: true,
              type: true,
            },
            orderBy: {
              type: "asc", // Ordenar para priorizar Mobile
            },
          },
        },
      },
      followUp: {
        select: {
          id: true,
          propertyId: true,
          plannedDate: true,
          executedDate: true,
          wasContacted: true,
          comment: true,
        },
      },
    };
  }

  private mapReminderToDTO(reminder: any): ReminderDTO {
    const metadata = reminder.metadata
      ? (reminder.metadata as Record<string, unknown>)
      : null;
    const dto: ReminderDTO = {
      id: reminder.id,
      title: reminder.title,
      note: reminder.note,
      responsibleId: reminder.responsibleId,
      creatorId: reminder.creatorId,
      propertyId: reminder.propertyId,
      buildingId: reminder.buildingId,
      personId: reminder.personId,
      followUpId: reminder.followUpId,
      scheduledAt: reminder.scheduledAt,
      timezone: reminder.timezone,
      recurrenceType: reminder.recurrenceType,
      recurrenceRule: reminder.recurrenceRule,
      recurrenceEndsAt: reminder.recurrenceEndsAt,
      status: reminder.status,
      metadata,
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
      responsible: reminder.responsible,
      creator: reminder.creator,
      building: reminder.building,
      person: reminder.person
        ? {
            id: reminder.person.id,
            firstName: reminder.person.firstName,
            lastName: reminder.person.lastName,
            email: reminder.person.email,
            phones: reminder.person.phones?.map((p: any) => ({
              id: p.id,
              phone: p.phone,
              type: p.type,
            })) || null,
          }
        : null,
      property: reminder.property
        ? {
            id: reminder.property.id,
            number: reminder.property.number,
            floor: reminder.property.floor,
            buildingId: reminder.property.buildingId,
            building: reminder.property.building,
            propertyPersons: reminder.property.propertyPersons?.map((pp: any) => ({
              id: pp.id,
              role: pp.role,
              person: {
                id: pp.person.id,
                firstName: pp.person.firstName,
                lastName: pp.person.lastName,
                email: pp.person.email,
                phones: pp.person.phones?.map((p: any) => ({
                  id: p.id,
                  phone: p.phone,
                  type: p.type,
                })) || null,
              },
            })) || [],
          }
        : null,
      followUp: reminder.followUp,
    };
    return dto;
  }

  private mapOccurrenceToDTO(occurrence: any): ReminderOccurrenceDTO {
    const metadata = occurrence.metadata
      ? (occurrence.metadata as Record<string, unknown>)
      : null;
    return {
      id: occurrence.id,
      reminderId: occurrence.reminderId,
      followUpId: occurrence.followUpId,
      scheduledFor: occurrence.scheduledFor,
      originalScheduledFor: occurrence.originalScheduledFor,
      timezone: occurrence.timezone,
      status: occurrence.status,
      completedAt: occurrence.completedAt,
      skippedAt: occurrence.skippedAt,
      skippedReason: occurrence.skippedReason,
      autoGenerated: occurrence.autoGenerated,
      sequence: occurrence.sequence,
      metadata,
      reminder: occurrence.reminder
        ? this.mapReminderToDTO(occurrence.reminder)
        : undefined,
    };
  }

  private toJsonValue(data: unknown): Prisma.InputJsonValue | undefined {
    if (data === undefined || data === null) {
      return undefined;
    }
    return data as Prisma.InputJsonValue;
  }

  private isoToUtc(isoDate: string, timezone: string): Date {
    const dt = DateTime.fromISO(isoDate, { zone: timezone || DEFAULT_TIMEZONE });
    if (!dt.isValid) {
      throw new Error("Fecha inválida para el recordatorio");
    }
    return dt.toUTC().toJSDate();
  }

  private buildRecurrenceData(
    recurrence: ReminderRecurrenceConfig,
    scheduledAt: Date,
    timezone: string
  ): {
    rule: string | null;
    type: ReminderRecurrenceType;
    endsAt: Date | null;
    metadata: Record<string, unknown> | null;
  } {
    const type = recurrence.type;
    let rule: string | null = null;
    let endsAt: Date | null = null;

    const dtStart = DateTime.fromJSDate(scheduledAt).toUTC().toJSDate();

    if (recurrence.endDate) {
      endsAt = this.isoToUtc(recurrence.endDate, timezone);
    }

    const metadata: Record<string, unknown> = {
      recurrence,
    };

    if (type === "once") {
      return { rule: null, type, endsAt, metadata };
    }

    if (type === "custom" && recurrence.customRule) {
      rule = recurrence.customRule;
      return { rule, type, endsAt, metadata };
    }

    const options: Partial<RRuleOptions> = {
      dtstart: dtStart,
      interval: recurrence.interval || 1,
      tzid: timezone,
    };

    switch (type) {
      case "daily":
        options.freq = RRule.DAILY;
        break;
      case "weekly":
        options.freq = RRule.WEEKLY;
        options.byweekday =
          recurrence.daysOfWeek && recurrence.daysOfWeek.length
            ? recurrence.daysOfWeek.map((day) => WEEKDAY_MAP[day])
            : [WEEKDAY_MAP[DateTime.fromJSDate(scheduledAt).weekday % 7]];
        break;
      case "monthly":
        options.freq = RRule.MONTHLY;
        options.bymonthday = [
          DateTime.fromJSDate(scheduledAt).setZone(timezone).day,
        ];
        break;
      default:
        options.freq = RRule.DAILY;
        break;
    }

    if (endsAt) {
      options.until = endsAt;
    }

    const rrule = new RRule(options as RRuleOptions);
    rule = rrule.toString();

    return { rule, type, endsAt, metadata };
  }

  private async ensureOccurrencesForRange(
    reminder: PrismaReminderModel,
    start: DateTime,
    end: DateTime,
    includeRelations = false
  ): Promise<
    (PrismaReminderOccurrenceModel & {
      reminder?: PrismaReminderModel;
    })[]
  > {
    if (reminder.status !== "active" && reminder.status !== "paused") {
      return prisma.reminderOccurrence.findMany({
        where: {
          reminderId: reminder.id,
          deletedAt: null,
          scheduledFor: {
            gte: start.toJSDate(),
            lte: end.toJSDate(),
          },
        },
      });
    }

    const occurrenceWhere = {
      reminderId: reminder.id,
      deletedAt: null,
      scheduledFor: {
        gte: start.toJSDate(),
        lte: end.toJSDate(),
      },
    };

    const existingOccurrences = await prisma.reminderOccurrence.findMany({
      where: occurrenceWhere,
      include: includeRelations
        ? {
            reminder: {
              include: this.defaultInclude(),
            },
          }
        : undefined,
    });

    const existingTimestamps = new Set(
      existingOccurrences.map((occ) => occ.scheduledFor.getTime())
    );

    const generatedDates = this.generateDatesForRange(reminder, start, end);

    if (generatedDates.length === 0) {
      return existingOccurrences;
    }

    const maxSequence = await prisma.reminderOccurrence.aggregate({
      where: { reminderId: reminder.id },
      _max: { sequence: true },
    });

    let sequence =
      (maxSequence._max.sequence !== null ? maxSequence._max.sequence : -1) + 1;

    const toCreate: PrismaReminderOccurrenceModel[] = [];

    for (const date of generatedDates) {
      if (!existingTimestamps.has(date.toJSDate().getTime())) {
        const created = await prisma.reminderOccurrence.create({
          data: {
            reminderId: reminder.id,
            scheduledFor: date.toJSDate(),
            originalScheduledFor: date.toJSDate(),
            timezone: reminder.timezone,
            status: "pending",
            autoGenerated: true,
            sequence,
          },
        });
        sequence += 1;
        toCreate.push(created);
      }
    }

    if (toCreate.length > 0) {
      return prisma.reminderOccurrence.findMany({
        where: occurrenceWhere,
        include: includeRelations
          ? {
              reminder: {
                include: this.defaultInclude(),
              },
            }
          : undefined,
      });
    }

    return existingOccurrences;
  }

  private generateDatesForRange(
    reminder: PrismaReminderModel,
    start: DateTime,
    end: DateTime
  ): DateTime[] {
    const dates: DateTime[] = [];

    const scheduledAt = DateTime.fromJSDate(reminder.scheduledAt).toUTC();

    if (reminder.recurrenceType === "once" || !reminder.recurrenceRule) {
      if (
        scheduledAt >= start.toUTC() &&
        scheduledAt <= end.toUTC()
      ) {
        dates.push(scheduledAt);
      }
      return dates;
    }

    const rule = rrulestr(reminder.recurrenceRule, {
      dtstart: reminder.scheduledAt,
    });

    const occurrences = rule.between(start.toJSDate(), end.toJSDate(), true);

    for (const occ of occurrences) {
      const dt = DateTime.fromJSDate(occ).toUTC();
      if (dt <= end && dt >= start) {
        dates.push(dt);
      }
    }

    return dates;
  }

  private async ensureAccess(
    reminder: PrismaReminderModel,
    requesterId: number
  ) {
    if (reminder.creatorId === requesterId || reminder.responsibleId === requesterId) {
      return;
    }

    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      include: { roles: { include: { role: true } } },
    });

    const isDirector = requester?.roles.some(
      (ur) => ur.role.name === "Director"
    );

    if (!isDirector) {
      throw new Error("No tienes permisos sobre este recordatorio");
    }
  }
}

export const reminderService = new ReminderService();


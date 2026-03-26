import { prisma } from "@core/lib";
import { S3StorageService } from "@core/services";
import { prependS3EnvPrefix } from "@core/utils";
import {
  MailboxingDTO,
  CreateMailboxingRequest,
  UpdateMailboxingRequest,
  MailboxingQueryParams,
  MailboxingListResponse,
  MailboxingAttachmentDTO,
  UpdateMailboxingAttachmentRequest,
} from "../types";
import path from "path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";

class MailboxingService {
  private readonly s3 = S3StorageService.getInstance();

  async createMailboxing(
    input: CreateMailboxingRequest,
    mailboxerId: number
  ): Promise<MailboxingDTO> {
    // Verificar que el edificio existe
    const building = await prisma.building.findUnique({
      where: { id: input.buildingId },
    });

    if (!building) {
      throw new Error("Edificio no encontrado");
    }

    // Si status es 'no_disturb', actualizar el Building
    if (input.status === "no_disturb") {
      await prisma.building.update({
        where: { id: input.buildingId },
        data: { noDisturb: true },
      });
    }

    const mailboxing = await prisma.mailboxing.create({
      data: {
        mailboxerId,
        buildingId: input.buildingId,
        status: input.status,
        executionStatus: input.executionStatus || "completed",
        comment: input.comment,
        date: new Date(input.date),
        properties: input.propertyIds && input.propertyIds.length > 0 ? {
          create: input.propertyIds.map(id => ({
            propertyId: id
          }))
        } : undefined,
      },
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
        properties: {
          include: {
            property: {
              select: {
                id: true,
                number: true,
                floor: true,
              },
            },
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
            mimeType: true,
            fileSize: true,
            s3Key: true,
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
    });

    return this.mapToDTO(mailboxing);
  }

  async getMailboxingById(id: number, userId: number): Promise<MailboxingDTO> {
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
      deletedAt: null,
    };

    // Si no es director, solo puede ver sus propios buzoneamientos
    if (!isDirector) {
      whereCondition.mailboxerId = userId;
    }
    // Si es director, puede ver cualquier buzoneamiento (no agregamos restricción de mailboxerId)

    const mailboxing = await prisma.mailboxing.findFirst({
      where: whereCondition,
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
    });

    if (!mailboxing) {
      throw new Error("Buzoneamiento no encontrado");
    }

    return this.mapToDTO(mailboxing);
  }

  async getMailboxings(
    query: MailboxingQueryParams,
    mailboxerId?: number, // Opcional: si no se proporciona, muestra todos
    isDirector: boolean = false // Si es director, puede ver todos
  ): Promise<MailboxingListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    // Si no es director y se proporciona mailboxerId, filtrar por usuario
    if (!isDirector && mailboxerId) {
      where.mailboxerId = mailboxerId;
    }

    // Si es director pero se especifica un mailboxerId en query, filtrar
    if (isDirector && query.mailboxerId) {
      where.mailboxerId = query.mailboxerId;
    }

    if (query.buildingId) {
      where.buildingId = query.buildingId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.executionStatus) {
      where.executionStatus = query.executionStatus;
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
          properties: {
            include: {
              property: {
                select: {
                  id: true,
                  number: true,
                  floor: true,
                },
              },
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

    const data = await Promise.all(mailboxings.map((mb) => this.mapToDTO(mb)));

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

  async updateMailboxing(
    id: number,
    input: UpdateMailboxingRequest,
    mailboxerId: number,
    isDirector: boolean = false
  ): Promise<MailboxingDTO> {
    // Verificar que el buzoneamiento existe y pertenece al usuario
    const existing = await prisma.mailboxing.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(isDirector ? {} : { mailboxerId }),
      },
    });

    if (!existing) {
      throw new Error("Buzoneamiento no encontrado");
    }

    // Si status cambia, actualizar el Building.noDisturb
    // Solo actualizar Building.noDisturb si status es 'no_disturb'
    if (input.status !== undefined) {
      if (input.status === "no_disturb") {
        await prisma.building.update({
          where: { id: existing.buildingId },
          data: { noDisturb: true },
        });
      } else if (existing.status === "no_disturb") {
        // Si el estado anterior era 'no_disturb' y ahora no lo es, limpiar Building.noDisturb
        // Nota: Esto solo limpia si no hay otros buzoneamientos con 'no_disturb' recientes
        // Por simplicidad, dejamos Building.noDisturb como está
        // (se puede implementar lógica más compleja si es necesario)
      }
    }

    const updateData: any = {};
    if (input.status !== undefined) updateData.status = input.status;
    if (input.executionStatus !== undefined) updateData.executionStatus = input.executionStatus;
    if (input.comment !== undefined) updateData.comment = input.comment;
    if (input.date !== undefined) updateData.date = new Date(input.date);

    const mailboxing = await prisma.mailboxing.update({
      where: { id },
      data: updateData,
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
            mimeType: true,
            fileSize: true,
            s3Key: true,
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
    });

    return this.mapToDTO(mailboxing);
  }

  async deleteMailboxing(id: number, mailboxerId: number): Promise<void> {
    const mailboxing = await prisma.mailboxing.findFirst({
      where: {
        id,
        mailboxerId,
        deletedAt: null,
      },
    });

    if (!mailboxing) {
      throw new Error("Buzoneamiento no encontrado");
    }

    await prisma.mailboxing.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async getActiveAssignments(userId: number): Promise<any[]> {
    const now = new Date();

    const assignments = await prisma.assignment.findMany({
      where: {
        userId,
        type: "Mailboxing",
        deletedAt: null,
        endDate: { gte: now },
      },
      include: {
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
      },
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    }));
  }

  async uploadAttachment(
    mailboxingId: number,
    file: Express.Multer.File,
    mailboxerId: number
  ): Promise<MailboxingAttachmentDTO> {
    // Validar que el mailboxing existe y pertenece al usuario
    const mailboxing = await prisma.mailboxing.findFirst({
      where: {
        id: mailboxingId,
        mailboxerId,
        deletedAt: null,
      },
    });

    if (!mailboxing) {
      throw new Error("Buzoneamiento no encontrado");
    }

    this.validateFile(file);

    const fileBuffer = await fs.readFile(file.path);
    const key = this.buildS3Key(mailboxingId, file.originalname);

    await this.s3.uploadFile({
      key,
      body: fileBuffer,
      contentType: file.mimetype,
      contentLength: file.size,
      cacheControl: "public, max-age=31536000",
    });

    await this.removeLocalFile(file.path);

    const publicUrl = this.s3.getPublicUrl(key);

    const attachment = await prisma.mailboxingAttachment.create({
      data: {
        mailboxingId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        s3Key: key,
        url: publicUrl,
        uploadedById: mailboxerId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return this.mapAttachmentToDTO(attachment);
  }

  async listAttachments(
    mailboxingId: number,
    requesterId: number,
    isDirector: boolean = false
  ): Promise<MailboxingAttachmentDTO[]> {
    const mailboxing = await prisma.mailboxing.findFirst({
      where: {
        id: mailboxingId,
        deletedAt: null,
        ...(isDirector ? {} : { mailboxerId: requesterId }),
      },
      include: {
        attachments: {
          where: {
            deletedAt: null,
          },
          include: {
            uploadedBy: {
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
        },
      },
    });

    if (!mailboxing) {
      throw new Error("Buzoneamiento no encontrado");
    }

    return Promise.all(
      mailboxing.attachments.map((attachment) =>
        this.mapAttachmentToDTO(attachment)
      )
    );
  }

  async updateAttachment(
    mailboxingId: number,
    attachmentId: number,
    mailboxerId: number,
    body: UpdateMailboxingAttachmentRequest,
    isDirector: boolean = false
  ): Promise<MailboxingAttachmentDTO> {
    const attachment = await prisma.mailboxingAttachment.findFirst({
      where: {
        id: attachmentId,
        mailboxingId,
        deletedAt: null,
        mailboxing: {
          deletedAt: null,
          ...(isDirector ? {} : { mailboxerId }),
        },
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new Error("Archivo no encontrado");
    }

    const updated = await prisma.mailboxingAttachment.update({
      where: { id: attachmentId },
      data: {
        ...(body.fileName && { fileName: body.fileName }),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return this.mapAttachmentToDTO(updated);
  }

  async deleteAttachment(
    mailboxingId: number,
    attachmentId: number,
    mailboxerId: number,
    isDirector: boolean = false
  ): Promise<void> {
    // Validar ownership
    const attachment = await prisma.mailboxingAttachment.findFirst({
      where: {
        id: attachmentId,
        mailboxingId,
        mailboxing: {
          deletedAt: null,
          ...(isDirector ? {} : { mailboxerId }),
        },
        deletedAt: null,
      },
    });

    if (!attachment) {
      throw new Error("Archivo no encontrado");
    }

    await prisma.mailboxingAttachment.update({
      where: { id: attachmentId },
      data: { deletedAt: new Date() },
    });

    try {
      await this.s3.deleteFile(attachment.s3Key);
    } catch (error) {
      console.error("Error eliminando archivo en S3:", error);
    }
  }

  private async mapToDTO(mailboxing: any): Promise<MailboxingDTO> {
    const attachments =
      mailboxing.attachments && mailboxing.attachments.length > 0
        ? await Promise.all(
            mailboxing.attachments.map((attachment: any) =>
              this.mapAttachmentToDTO(attachment)
            )
          )
        : [];

    return {
      id: mailboxing.id,
      mailboxerId: mailboxing.mailboxerId,
      mailboxer: mailboxing.mailboxer,
      buildingId: mailboxing.buildingId,
      building: mailboxing.building,
      propertyIds: mailboxing.properties?.map((p: any) => p.propertyId) || [],
      properties: mailboxing.properties?.map((p: any) => p.property) || [],
      status: mailboxing.status,
      executionStatus: mailboxing.executionStatus || "completed",
      comment: mailboxing.comment || undefined,
      date: mailboxing.date,
      createdAt: mailboxing.createdAt,
      updatedAt: mailboxing.updatedAt,
      deletedAt: mailboxing.deletedAt || undefined,
      attachments,
    };
  }

  private async mapAttachmentToDTO(
    attachment: any
  ): Promise<MailboxingAttachmentDTO> {
    const signedUrl = await this.s3.getSignedUrl(attachment.s3Key);

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
  }

  private buildS3Key(mailboxingId: number, originalName: string): string {
    const extension = path.extname(originalName).toLowerCase();
    const baseName = path
      .basename(originalName, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "_");
    const key = `mailboxing/${mailboxingId}/${Date.now()}-${randomUUID()}-${baseName}${extension}`;
    return prependS3EnvPrefix(key);
  }

  private async removeLocalFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn("No se pudo eliminar el archivo temporal", error);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    const validTypes = /^(image|video)\//;
    if (!validTypes.test(file.mimetype)) {
      throw new Error("Solo se permiten imágenes y videos");
    }

    const maxSizeMB = parseInt(
      process.env.ATTACHMENTS_MAX_FILE_SIZE_MB || "20",
      10
    );
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(
        `El archivo supera el tamaño máximo permitido (${maxSizeMB}MB)`
      );
    }
  }

  async getMailboxingStats(): Promise<{
    total: number;
    byMailboxer: Array<{
      mailboxerId: number;
      mailboxerName: string;
      count: number;
    }>;
    byStatus: {
      inside: number;
      outside: number;
      noDisturb: number;
    };
    byNoDisturb: {
      noDisturb: number;
      normal: number;
    };
    recent: number; // Últimos 30 días
  }> {
    const where = { deletedAt: null };

    // Estadísticas generales
    const total = await prisma.mailboxing.count({ where });

    // Por buzoneador
    const byMailboxer = await prisma.mailboxing.groupBy({
      by: ["mailboxerId"],
      where,
      _count: {
        mailboxerId: true,
      },
    });

    const mailboxerDetails = await Promise.all(
      byMailboxer.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.mailboxerId },
          select: { firstName: true, lastName: true },
        });
        return {
          mailboxerId: item.mailboxerId,
          mailboxerName: user
            ? `${user.firstName} ${user.lastName}`
            : "Desconocido",
          count: item._count.mailboxerId || 0,
        };
      })
    );

    // Por estado (status)
    const insideCount = await prisma.mailboxing.count({
      where: { ...where, status: "inside" },
    });
    const outsideCount = await prisma.mailboxing.count({
      where: { ...where, status: "outside" },
    });
    const noDisturbCount = await prisma.mailboxing.count({
      where: { ...where, status: "no_disturb" },
    });
    const normalCount = total - noDisturbCount;

    // Recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCount = await prisma.mailboxing.count({
      where: {
        ...where,
        date: { gte: thirtyDaysAgo },
      },
    });

    return {
      total,
      byMailboxer: mailboxerDetails.sort((a, b) => b.count - a.count),
      byStatus: {
        inside: insideCount,
        outside: outsideCount,
        noDisturb: noDisturbCount,
      },
      byNoDisturb: {
        noDisturb: noDisturbCount,
        normal: normalCount,
      },
      recent: recentCount,
    };
  }
}

const mailboxingService = new MailboxingService();
export default mailboxingService;

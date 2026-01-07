import { prisma } from "@core/lib";
import { S3StorageService } from "@core/services";
import { prependS3EnvPrefix } from "@core/utils";
import { PropertyAttachmentDTO, UpdatePropertyAttachmentBody } from "../types";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export class PropertyAttachmentService {
  private readonly s3 = S3StorageService.getInstance();

  async list(propertyId: number): Promise<PropertyAttachmentDTO[]> {
    await this.ensurePropertyExists(propertyId);

    const attachments = await prisma.propertyAttachment.findMany({
      where: {
        propertyId,
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
    });

    return Promise.all(attachments.map((attachment) => this.mapToDTO(attachment)));
  }

  async create(
    propertyId: number,
    file: Express.Multer.File,
    uploadedById?: number
  ): Promise<PropertyAttachmentDTO> {
    await this.ensurePropertyExists(propertyId);

    this.validateFile(file);

    const fileBuffer = await fs.readFile(file.path);

    const key = this.buildS3Key(propertyId, file.originalname);

    await this.s3.uploadFile({
      key,
      body: fileBuffer,
      contentType: file.mimetype,
      contentLength: file.size,
      cacheControl: "public, max-age=31536000",
    });

    await this.removeLocalFile(file.path);

    const publicUrl = this.s3.getPublicUrl(key);

    const attachment = await prisma.propertyAttachment.create({
      data: {
        propertyId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        s3Key: key,
        url: publicUrl,
        uploadedById,
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

    return this.mapToDTO(attachment);
  }

  async update(
    propertyId: number,
    attachmentId: number,
    body: UpdatePropertyAttachmentBody
  ): Promise<PropertyAttachmentDTO> {
    const existing = await this.getAttachment(propertyId, attachmentId);

    const updated = await prisma.propertyAttachment.update({
      where: { id: existing.id },
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

    return this.mapToDTO(updated);
  }

  async delete(propertyId: number, attachmentId: number): Promise<void> {
    const existing = await this.getAttachment(propertyId, attachmentId);

    await prisma.$transaction(async (tx) => {
      await tx.propertyAttachment.update({
        where: { id: existing.id },
        data: {
          deletedAt: new Date(),
        },
      });

      try {
        await this.s3.deleteFile(existing.s3Key);
      } catch (error) {
        // Registrar y continuar: preferimos mantener consistencia en BD
        console.error("Error eliminando archivo de S3", error);
      }
    });
  }

  private async ensurePropertyExists(propertyId: number): Promise<void> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId, deletedAt: null },
      select: { id: true },
    });

    if (!property) {
      throw new Error("La propiedad no existe o fue eliminada");
    }
  }

  private buildS3Key(propertyId: number, originalName: string): string {
    const extension = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9-_]/g, "_");
    const key = `properties/${propertyId}/${Date.now()}-${randomUUID()}-${baseName}${extension}`;
    return prependS3EnvPrefix(key);
  }

  private async mapToDTO(attachment: any): Promise<PropertyAttachmentDTO> {
    const signedUrl = await this.s3.getSignedUrl(attachment.s3Key);
    return {
      id: attachment.id,
      propertyId: attachment.propertyId,
      fileName: attachment.fileName ?? undefined,
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

  private async getAttachment(propertyId: number, attachmentId: number) {
    const attachment = await prisma.propertyAttachment.findFirst({
      where: {
        id: attachmentId,
        propertyId,
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
    });

    if (!attachment) {
      throw new Error("El adjunto no existe o fue eliminado");
    }

    return attachment;
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

    const maxSizeMB = parseInt(process.env.ATTACHMENTS_MAX_FILE_SIZE_MB || "20", 10);
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`El archivo supera el tamaño máximo permitido (${maxSizeMB}MB)`);
    }
  }
}



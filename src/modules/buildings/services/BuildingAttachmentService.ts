import { prisma } from "@core/lib";
import { S3StorageService } from "@core/services";
import { prependS3EnvPrefix } from "@core/utils";
import {
  BuildingAttachmentDTO,
  UpdateBuildingAttachmentBody,
} from "../types";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export class BuildingAttachmentService {
  private readonly s3 = S3StorageService.getInstance();

  async list(buildingId: number): Promise<BuildingAttachmentDTO[]> {
    await this.ensureBuildingExists(buildingId);

    const attachments = await prisma.buildingAttachment.findMany({
      where: {
        buildingId,
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
    buildingId: number,
    file: Express.Multer.File,
    uploadedById?: number
  ): Promise<BuildingAttachmentDTO> {
    await this.ensureBuildingExists(buildingId);
    this.validateFile(file);

    const fileBuffer = await fs.readFile(file.path);
    const key = this.buildS3Key(buildingId, file.originalname);

    await this.s3.uploadFile({
      key,
      body: fileBuffer,
      contentType: file.mimetype,
      contentLength: file.size,
      cacheControl: "public, max-age=31536000",
    });

    await this.removeLocalFile(file.path);

    const publicUrl = this.s3.getPublicUrl(key);

    const attachment = await prisma.buildingAttachment.create({
      data: {
        buildingId,
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
    buildingId: number,
    attachmentId: number,
    body: UpdateBuildingAttachmentBody
  ): Promise<BuildingAttachmentDTO> {
    const existing = await this.getAttachment(buildingId, attachmentId);

    const updated = await prisma.buildingAttachment.update({
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

  async delete(buildingId: number, attachmentId: number): Promise<void> {
    const existing = await this.getAttachment(buildingId, attachmentId);

    await prisma.$transaction(async (tx) => {
      await tx.buildingAttachment.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });

      try {
        await this.s3.deleteFile(existing.s3Key);
      } catch (error) {
        console.error("Error eliminando archivo de S3", error);
      }
    });
  }

  private async ensureBuildingExists(buildingId: number): Promise<void> {
    const building = await prisma.building.findUnique({
      where: { id: buildingId, deletedAt: null },
      select: { id: true },
    });

    if (!building) {
      throw new Error("El edificio no existe o fue eliminado");
    }
  }

  private buildS3Key(buildingId: number, originalName: string): string {
    const extension = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9-_]/g, "_");
    const key = `buildings/${buildingId}/${Date.now()}-${randomUUID()}-${baseName}${extension}`;
    return prependS3EnvPrefix(key);
  }

  private async getAttachment(buildingId: number, attachmentId: number) {
    const attachment = await prisma.buildingAttachment.findFirst({
      where: {
        id: attachmentId,
        buildingId,
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

  private async mapToDTO(attachment: any): Promise<BuildingAttachmentDTO> {
    const signedUrl = await this.s3.getSignedUrl(attachment.s3Key);
    return {
      id: attachment.id,
      buildingId: attachment.buildingId,
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



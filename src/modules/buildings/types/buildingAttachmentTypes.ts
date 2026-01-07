import { z } from "zod";
import { getBuildingByIdParamsSchema } from "./buildingTypes";

export const buildingAttachmentParamsSchema = getBuildingByIdParamsSchema;

export const buildingAttachmentCompositeParamsSchema =
  buildingAttachmentParamsSchema.merge(
    z.object({
      attachmentId: z.coerce.number().int().positive(),
    })
  );

export const updateBuildingAttachmentSchema = z
  .object({
    fileName: z
      .string()
      .min(1, "El nombre del archivo es requerido")
      .max(255, "El nombre del archivo no puede exceder 255 caracteres")
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    "Debe proporcionar al menos un campo para actualizar"
  );

export type BuildingAttachmentParams = z.infer<
  typeof buildingAttachmentParamsSchema
>;
export type BuildingAttachmentCompositeParams = z.infer<
  typeof buildingAttachmentCompositeParamsSchema
>;
export type UpdateBuildingAttachmentBody = z.infer<
  typeof updateBuildingAttachmentSchema
>;

export interface BuildingAttachmentDTO {
  id: number;
  buildingId: number;
  fileName?: string;
  mimeType?: string | null;
  fileSize?: number | null;
  s3Key: string;
  url: string;
  signedUrl: string;
  uploadedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}



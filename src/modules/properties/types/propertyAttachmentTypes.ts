import { z } from "zod";
import { getPropertyByIdParamSchema } from "./propertyTypes";

export const propertyAttachmentIdParamSchema = z.object({
  attachmentId: z.coerce.number().int().positive(),
});

export const propertyAttachmentParamsSchema = getPropertyByIdParamSchema;

export const propertyAttachmentCompositeParamsSchema = propertyAttachmentParamsSchema.merge(
  propertyAttachmentIdParamSchema
);

export const updatePropertyAttachmentSchema = z
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

export type PropertyAttachmentParams = z.infer<typeof propertyAttachmentParamsSchema>;
export type PropertyAttachmentIdParams = z.infer<typeof propertyAttachmentIdParamSchema>;
export type PropertyAttachmentCompositeParams = z.infer<
  typeof propertyAttachmentCompositeParamsSchema
>;
export type UpdatePropertyAttachmentBody = z.infer<typeof updatePropertyAttachmentSchema>;

export interface PropertyAttachmentDTO {
  id: number;
  propertyId: number;
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



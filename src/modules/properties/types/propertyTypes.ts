import { z } from "zod";

export const getPropertyByIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type GetPropertyByIdParams = z.infer<typeof getPropertyByIdParamSchema>;

export const PropertyStatusEnum = z.enum([
  "sin_estado",
  "noticia_venta",
  "noticia_alquiler",
  "antiguo_cliente",
]);

export const patchPropertyBodySchema = z
  .object({
    number: z.string().optional(),
    floor: z.number().int().optional(),
    buildingId: z.number().int().positive().optional(),
    ownerId: z.number().int().positive().optional().nullable(),
    tenantId: z.number().int().positive().optional().nullable(),
    capturedById: z.number().int().positive().optional().nullable(),
    appraisalPrice: z.number().optional().nullable(),
    occupiedBy: z.enum(["owner", "tenant", "none"]).optional().nullable(),
    importantNotice: z.string().optional().nullable(),
    rso_comment: z.string().optional().nullable(),
    noDisturb: z.boolean().optional(),
    noDoormat: z.boolean().optional(),
    noBell: z.boolean().optional(),
    noCounter: z.boolean().optional(),
    soldRentedUs: z.boolean().optional(),
    branch: z.string().optional().nullable(),
    // NUEVOS CAMPOS
    salePrice: z.number().optional().nullable(),
    rentalPrice: z.number().optional().nullable(),
    status: PropertyStatusEnum.optional(),
    isPresident: z.boolean().optional(),
    isInformer: z.boolean().optional(),
    isSecondResidence: z.boolean().optional(),
    isOpportunity: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((val) => val !== undefined),
    "At least one field must be provided"
  );
export type PatchPropertyBody = z.infer<typeof patchPropertyBodySchema>;

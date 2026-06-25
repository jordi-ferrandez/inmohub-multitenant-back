import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { errorResponse } from "@core/utils";

const propertySchema = z.object({
  address: z.string().min(1, "La dirección es obligatoria"),
  municipality: z.string().optional(),
  province: z.string().optional(),
  zipCode: z.string().optional(),
  type: z.string().min(1, "El tipo de propiedad es obligatorio"),
  builtM2: z.coerce.number().positive("Los metros construidos deben ser positivos"),
  rooms: z.coerce.number().int().nonnegative(),
  bathrooms: z.coerce.number().int().nonnegative(),
  yearBuilt: z.coerce.number().int().optional(),
  state: z.string().optional(),
  floor: z.string().optional(),
  hasElevator: z.boolean().optional().default(false),
  hasGarage: z.boolean().optional().default(false),
  hasTerrace: z.boolean().optional().default(false),
  hasPool: z.boolean().optional().default(false),
  hasGarden: z.boolean().optional().default(false),
  hasStorage: z.boolean().optional().default(false),
});

const contactSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  consent: z.boolean().optional(),
});

export const processValuationSchema = z.object({
  slug: z.string().min(1, "El slug es obligatorio"),
  property: propertySchema,
  contact: contactSchema.optional(),
});

export const createInternalValuationSchema = z.object({
  propertyId: z.coerce.number().int().positive().optional(),
  property: propertySchema,
});

export const slugParamSchema = z.object({
  slug: z.string().min(1, "Slug inválido"),
});

export const validateProcessValuation = (req: Request, res: Response, next: NextFunction): void => {
  const result = processValuationSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateCreateInternalValuation = (req: Request, res: Response, next: NextFunction): void => {
  const result = createInternalValuationSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateSlugParam = (req: Request, res: Response, next: NextFunction): void => {
  const result = slugParamSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, "Slug inválido", 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

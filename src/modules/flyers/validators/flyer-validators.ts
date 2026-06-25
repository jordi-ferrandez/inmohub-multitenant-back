import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { errorResponse } from "@core/utils";

export const createFlyerSchema = z.object({
  propertyId: z.coerce.number().int().positive("ID de propiedad inválido"),
  templateId: z.coerce.number().int().positive("ID de plantilla inválido"),
  qrContent: z.string().min(1, "El contenido QR es obligatorio"),
});

export const shipFlyerSchema = z.object({
  notes: z.string().optional(),
});

export const propertyIdParamSchema = z.object({
  propertyId: z.string().regex(/^\d+$/, "ID de propiedad inválido"),
});

export const flyerIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID de flyer inválido"),
});

export const validateCreateFlyer = (req: Request, res: Response, next: NextFunction): void => {
  const result = createFlyerSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateShipFlyer = (req: Request, res: Response, next: NextFunction): void => {
  const result = shipFlyerSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validatePropertyIdParam = (req: Request, res: Response, next: NextFunction): void => {
  const result = propertyIdParamSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, "ID de propiedad inválido", 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

export const validateFlyerIdParam = (req: Request, res: Response, next: NextFunction): void => {
  const result = flyerIdParamSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, "ID de flyer inválido", 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

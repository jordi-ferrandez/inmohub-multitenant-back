import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { errorResponse } from "@core/utils";

export const availablePropertiesQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const propertyIdParamSchema = z.object({
  propertyId: z.string().regex(/^\d+$/, "ID de propiedad inválido"),
});

export const validateAvailablePropertiesQuery = (req: Request, res: Response, next: NextFunction): void => {
  const result = availablePropertiesQuerySchema.safeParse(req.query);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.queryValidated = result.data;
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

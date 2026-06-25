import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { errorResponse } from "@core/utils";

export const createCompanySchema = z.object({
  name: z.string().min(1, "El nombre de la empresa es obligatorio"),
});

export const createApiKeySchema = z.object({
  companyId: z.coerce.number().int().positive().optional(),
  name: z.string().min(1, "El nombre de la API Key es obligatorio"),
  scopes: z.array(z.string()).optional().default([]),
  expiresAt: z.string().datetime().optional(),
  restrictedIps: z.array(z.string()).optional().default([]),
});

export const revokeKeyParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID de API Key inválido"),
});

export const validateCreateCompany = (req: Request, res: Response, next: NextFunction): void => {
  const result = createCompanySchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateCreateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const result = createApiKeySchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateRevokeKeyParam = (req: Request, res: Response, next: NextFunction): void => {
  const result = revokeKeyParamSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, "ID de API Key inválido", 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

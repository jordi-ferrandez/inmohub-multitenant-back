import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { errorResponse } from "@core/utils";

export const createBoardSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  ownerId: z.coerce.number().int().positive().optional(),
  isPrivate: z.boolean().optional(),
});

export const createColumnSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateColumnSchema = z.object({
  title: z.string().min(1).optional(),
  order: z.coerce.number().int().min(0).optional(),
});

export const reorderColumnsSchema = z.object({
  columnIds: z.array(z.coerce.number().int().positive()).min(1, "Debe incluir al menos una columna"),
});

export const createCardSchema = z.object({
  columnId: z.coerce.number().int().positive("ID de columna inválido"),
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  responsibleId: z.coerce.number().int().positive().optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  responsibleId: z.coerce.number().int().positive().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const moveCardSchema = z.object({
  columnId: z.coerce.number().int().positive("ID de columna inválido"),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID inválido"),
});

export const validateCreateBoard = (req: Request, res: Response, next: NextFunction): void => {
  const result = createBoardSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateCreateColumn = (req: Request, res: Response, next: NextFunction): void => {
  const result = createColumnSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateUpdateColumn = (req: Request, res: Response, next: NextFunction): void => {
  const result = updateColumnSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateReorderColumns = (req: Request, res: Response, next: NextFunction): void => {
  const result = reorderColumnsSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateCreateCard = (req: Request, res: Response, next: NextFunction): void => {
  const result = createCardSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateUpdateCard = (req: Request, res: Response, next: NextFunction): void => {
  const result = updateCardSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateMoveCard = (req: Request, res: Response, next: NextFunction): void => {
  const result = moveCardSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateIdParam = (req: Request, res: Response, next: NextFunction): void => {
  const result = idParamSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, "ID inválido", 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

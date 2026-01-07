import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { errorResponse } from "@core/utils";

export const activityQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe estar en formato YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe estar en formato YYYY-MM-DD"),
  userId: z.coerce.number().int().positive().optional(),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  },
  {
    message: "endDate debe ser mayor o igual a startDate",
    path: ["endDate"],
  }
);

export const validateActivityQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validated = activityQuerySchema.parse(req.query);
    (req as any).queryValidated = validated;
    next();
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      errorResponse(res, "Error de validación", 400, errors);
      return;
    }
    next(error);
  }
};

export const activityItemsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe estar en formato YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe estar en formato YYYY-MM-DD"),
  userId: z.coerce.number().int().positive().optional(),
  type: z.enum(["followup", "mailboxing"]).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe estar en formato YYYY-MM-DD").optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(["date", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  },
  {
    message: "endDate debe ser mayor o igual a startDate",
    path: ["endDate"],
  }
);

export const validateActivityItemsQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validated = activityItemsQuerySchema.parse(req.query);
    (req as any).queryValidated = validated;
    next();
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      errorResponse(res, "Error de validación", 400, errors);
      return;
    }
    next(error);
  }
};


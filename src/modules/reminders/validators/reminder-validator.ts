import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  AgendaQueryParams,
  CreateReminderRequest,
  ReminderQueryParams,
  UpdateOccurrenceStatusRequest,
  UpdateReminderRequest,
} from "../types";
import { errorResponse } from "@core/utils";

const recurrenceSchema = z
  .object({
    type: z.enum(["once", "daily", "weekly", "monthly", "custom"]),
    interval: z.coerce.number().int().positive().optional(),
    daysOfWeek: z
      .array(z.coerce.number().int().min(0).max(6))
      .optional()
      .default([]),
    dayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
    customRule: z.string().min(1).optional(),
    endDate: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "weekly" && (!data.daysOfWeek || data.daysOfWeek.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["daysOfWeek"],
        message: "Debes seleccionar al menos un día de la semana",
      });
    }
    if (data.type === "custom" && !data.customRule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customRule"],
        message: "Debes proporcionar la regla personalizada (RRULE)",
      });
    }
  });

const createReminderSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  note: z.string().optional(),
  responsibleId: z.coerce.number().int().positive(),
  propertyId: z.coerce.number().int().positive().optional(),
  buildingId: z.coerce.number().int().positive().optional(),
  personId: z.coerce.number().int().positive().optional(),
  followUpId: z.coerce.number().int().positive().optional(),
  scheduledAt: z.string().datetime(),
  timezone: z.string().min(1).optional(),
  recurrence: recurrenceSchema,
  metadata: z.record(z.any()).optional(),
});

const updateReminderSchema = createReminderSchema
  .extend({
    status: z.enum(["active", "paused", "cancelled", "archived"]).optional(),
  })
  .partial();

const reminderQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  responsibleId: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  propertyId: z.string().optional(),
  buildingId: z.string().optional(),
  personId: z.string().optional(),
  followUpId: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

const agendaQuerySchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  responsibleId: z.string().optional(),
  includeCompleted: z.enum(["true", "false"]).optional(),
});

const reminderParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID inválido"),
});

const occurrenceParamsSchema = z.object({
  reminderId: z.string().regex(/^\d+$/),
  occurrenceId: z.string().regex(/^\d+$/),
});

const updateOccurrenceSchema = z.object({
  status: z.enum(["pending", "completed", "skipped", "cancelled"]),
  completedAt: z.string().datetime().optional(),
  skippedAt: z.string().datetime().optional(),
  skippedReason: z.string().optional(),
  followUpId: z.coerce.number().int().positive().nullable().optional(),
  scheduledFor: z.string().datetime().optional(),
  actionNote: z.string().optional(),
  metadata: z.record(z.any()).nullable().optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(["active", "paused", "cancelled", "archived"]),
});

export const validateCreateReminder = (
  req: Request<{}, {}, CreateReminderRequest>,
  res: Response,
  next: NextFunction
) => {
  const result = createReminderSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.bodyValidated = result.data as CreateReminderRequest;
  next();
};

export const validateUpdateReminder = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = updateReminderSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.bodyValidated = result.data as UpdateReminderRequest;
  next();
};

export const validateReminderQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = reminderQuerySchema.safeParse(req.query);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.queryValidated = result.data as ReminderQueryParams;
  next();
};

export const validateAgendaQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = agendaQuerySchema.safeParse(req.query);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.queryValidated = result.data as AgendaQueryParams;
  next();
};

export const validateReminderParams = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = reminderParamsSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

export const validateOccurrenceParams = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = occurrenceParamsSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

export const validateUpdateOccurrence = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = updateOccurrenceSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.bodyValidated = result.data as UpdateOccurrenceStatusRequest;
  next();
};

export const validateReminderStatus = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = statusUpdateSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};


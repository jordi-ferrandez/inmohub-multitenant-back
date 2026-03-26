import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  CreateMailboxingRequest,
  UpdateMailboxingRequest,
  MailboxingQueryParams,
} from "../types";
import { normalizeDateToUTC, getUserTimezone } from "@core/utils/dateUtils";
import { errorResponse } from "@core/utils/apiResponse";

export const mailboxingStatusSchema = z.enum(["inside", "outside", "no_disturb"]);

const mailboxingExecutionStatusSchema = z.enum(["pending", "completed", "skipped", "cancelled"]);

// Schema base sin transformación de fechas (se hace en el middleware)
const createMailboxingSchemaBase = z.object({
  buildingId: z.number().int().positive("ID de edificio inválido"),
  propertyIds: z.array(z.number().int().positive()).optional(),
  status: mailboxingStatusSchema,
  executionStatus: mailboxingExecutionStatusSchema.optional(),
  comment: z
    .string()
    .max(1000, "El comentario no puede exceder 1000 caracteres")
    .optional(),
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
    z.string().datetime("Formato de fecha inválido (ISO 8601)"),
    z.coerce.date(),
  ]),
  mailboxerId: z.number().int().positive().optional(),
});

// Middleware de validación con normalización de fechas
export const validateCreateMailboxing = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userTimezone = getUserTimezone(
    req.headers["x-user-timezone"] as string
  );

  const result = createMailboxingSchemaBase.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }

  // Normalizar fecha usando timezone del usuario
  const normalizedData = {
    ...result.data,
    date: normalizeDateToUTC(result.data.date, userTimezone),
  };

  req.body = normalizedData;
  next();
};

// Schema base sin transformación de fechas (se hace en el middleware)
const updateMailboxingSchemaBase = z.object({
  status: mailboxingStatusSchema.optional(),
  executionStatus: mailboxingExecutionStatusSchema.optional(),
  comment: z
    .string()
    .max(1000, "El comentario no puede exceder 1000 caracteres")
    .optional(),
  date: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
      z.string().datetime("Formato de fecha inválido (ISO 8601)"),
      z.coerce.date(),
    ])
    .optional(),
});

// Middleware de validación con normalización de fechas
export const validateUpdateMailboxing = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userTimezone = getUserTimezone(
    req.headers["x-user-timezone"] as string
  );

  const result = updateMailboxingSchemaBase.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }

  // Normalizar fecha usando timezone del usuario (solo si viene)
  const normalizedData = {
    ...result.data,
    ...(result.data.date && {
      date: normalizeDateToUTC(result.data.date, userTimezone),
    }),
  };

  req.body = normalizedData;
  next();
};

// Exportar schemas para compatibilidad con validateRequest si se usa en otros lugares
export const createMailboxingSchema = createMailboxingSchemaBase;
export const updateMailboxingSchema = updateMailboxingSchemaBase;

export const mailboxingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  buildingId: z.coerce.number().int().positive().optional(),
  mailboxerId: z.coerce.number().int().positive().optional(),
  status: mailboxingStatusSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const mailboxingParamsSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => val > 0, {
      message: "ID de buzoneamiento inválido",
    }),
});

export const attachmentParamsSchema = z.object({
  attachmentId: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => val > 0, {
      message: "ID de attachment inválido",
    }),
});

export const mailboxingIdParamsSchema = z.object({
  mailboxingId: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => val > 0, {
      message: "ID de buzoneamiento inválido",
    }),
});

export const mailboxingAttachmentParamsSchema = mailboxingIdParamsSchema;

export const mailboxingAttachmentCompositeParamsSchema =
  mailboxingAttachmentParamsSchema.merge(attachmentParamsSchema);

export const updateMailboxingAttachmentSchema = z
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

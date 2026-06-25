import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { errorResponse } from "@core/utils";

export const sendNotificationSchema = z.object({
  personId: z.coerce.number().int().positive("ID de persona inválido"),
  channel: z.enum(["EMAIL", "WHATSAPP", "SMS"], { message: "Canal no válido. Opciones: EMAIL, WHATSAPP, SMS" }),
  subject: z.string().min(1).optional(),
  message: z.string().min(1, "El mensaje es obligatorio"),
});

export const propertyVisitSchema = z.object({
  followUpId: z.coerce.number().int().positive("ID de seguimiento inválido"),
});

export const bulkNotificationSchema = z.object({
  personIds: z.array(z.coerce.number().int().positive()).min(1, "Debe incluir al menos una persona"),
  channel: z.enum(["EMAIL", "WHATSAPP", "SMS"], { message: "Canal no válido" }),
  subject: z.string().min(1).optional(),
  message: z.string().min(1, "El mensaje es obligatorio"),
});

export const preferenceSchema = z.object({
  notificationPreference: z.enum(["EMAIL", "WHATSAPP", "SMS", "NONE"], {
    message: "Preferencia no válida. Opciones: EMAIL, WHATSAPP, SMS, NONE",
  }),
});

export const validateSendNotification = (req: Request, res: Response, next: NextFunction): void => {
  const result = sendNotificationSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validatePropertyVisit = (req: Request, res: Response, next: NextFunction): void => {
  const result = propertyVisitSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, "ID de seguimiento inválido", 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

export const validateBulkNotification = (req: Request, res: Response, next: NextFunction): void => {
  const result = bulkNotificationSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validatePreference = (req: Request, res: Response, next: NextFunction): void => {
  const result = preferenceSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, "Preferencia de notificación no válida", 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

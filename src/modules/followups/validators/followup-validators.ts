import { z } from "zod";
import {
  CreateFollowUpRequest,
  UpdateFollowUpRequest,
  FollowUpQueryParams,
  ContactType,
  LetterType,
  ObservationType,
} from "../types";

// Enums para validación
const contactTypeEnum = z.nativeEnum(ContactType);
const letterTypeEnum = z.nativeEnum(LetterType);
const observationTypeEnum = z.nativeEnum(ObservationType);

const reminderRecurrenceSchema = z
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
    if (
      data.type === "weekly" &&
      (!data.daysOfWeek || data.daysOfWeek.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["daysOfWeek"],
        message:
          "Debes seleccionar al menos un día para la recurrencia semanal",
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

const reminderSchema = z
  .object({
    create: z.boolean().optional(),
    title: z.string().min(1).optional(),
    note: z.string().optional(),
    scheduledAt: z.string().datetime().optional(),
    timezone: z.string().min(1).optional(),
    recurrence: reminderRecurrenceSchema.optional(),
    responsibleId: z.coerce.number().int().positive().optional(),
  })
  .optional();

export const createFollowUpSchema = z
  .object({
    propertyId: z.number().int().positive("ID de propiedad inválido"),
    wasContacted: z.boolean(),
    contactType: contactTypeEnum.optional(),
    letterType: letterTypeEnum.optional(),
    observationType: observationTypeEnum.optional(),
    plannedDate: z
      .string()
      .datetime("Fecha planificada inválida")
      .transform((str) => new Date(str))
      .optional()
      .or(z.date().optional()),
    executedDate: z
      .string()
      .datetime("Fecha ejecutada inválida")
      .transform((str) => new Date(str))
      .optional()
      .or(z.date().optional()),
    comment: z
      .string()
      .max(1000, "El comentario no puede exceder 1000 caracteres")
      .optional(),
    reminder: reminderSchema,
  })
  .refine(
    (data) => {
      // Si wasContacted es true, contactType es requerido
      if (data.wasContacted && !data.contactType) {
        return false;
      }
      return true;
    },
    {
      message: "El tipo de contacto es requerido cuando wasContacted es true",
      path: ["contactType"],
    }
  )
  .refine(
    (data) => {
      // Si contactType es "Carta en mano", letterType es requerido
      if (data.contactType === ContactType.LETTER_IN_HAND && !data.letterType) {
        return false;
      }
      return true;
    },
    {
      message:
        "El tipo de carta es requerido cuando contactType es 'Carta en mano'",
      path: ["letterType"],
    }
  )
  .refine(
    (data) => {
      // Si observationType es "Carta debajo puerta", letterType es requerido
      if (
        data.observationType === ObservationType.LETTER_UNDER_DOOR &&
        !data.letterType
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "El tipo de carta es requerido cuando observationType es 'Carta debajo puerta'",
      path: ["letterType"],
    }
  )
  .refine(
    (data) => {
      // Si wasContacted es false, no se puede tener contactType
      // Pero sí puede tener letterType si observationType es LETTER_UNDER_DOOR
      if (!data.wasContacted && data.contactType) {
        return false;
      }
      return true;
    },
    {
      message:
        "No se puede tener tipo de contacto cuando wasContacted es false",
      path: ["wasContacted"],
    }
  )
  .refine(
    (data) => {
      // Si wasContacted es true, no se puede tener observationType
      if (data.wasContacted && data.observationType) {
        return false;
      }
      return true;
    },
    {
      message: "No se puede tener observación cuando wasContacted es true",
      path: ["observationType"],
    }
  )
  .refine(
    (data) => {
      // No se permiten seguimientos planificados
      if (data.plannedDate) {
        return false;
      }
      return true;
    },
    {
      message:
        "Los seguimientos no pueden ser planificados. Todos los seguimientos se registran como completados.",
      path: ["plannedDate"],
    }
  )
  .refine(
    (data) => {
      // La fecha de ejecución no puede ser futura
      if (data.executedDate) {
        const now = new Date();
        return data.executedDate <= now;
      }
      return true;
    },
    {
      message:
        "La fecha de ejecución no puede ser futura. El seguimiento se registrará con la fecha actual.",
      path: ["executedDate"],
    }
  );

export const updateFollowUpSchema = z
  .object({
    wasContacted: z.boolean().optional(),
    contactType: contactTypeEnum.optional(),
    letterType: letterTypeEnum.optional(),
    observationType: observationTypeEnum.optional(),
    plannedDate: z
      .string()
      .datetime("Fecha planificada inválida")
      .transform((str) => new Date(str))
      .optional()
      .or(z.date().optional()),
    executedDate: z
      .string()
      .datetime("Fecha ejecutada inválida")
      .transform((str) => new Date(str))
      .optional()
      .or(z.date().optional()),
    comment: z
      .string()
      .max(1000, "El comentario no puede exceder 1000 caracteres")
      .optional(),
    reminder: reminderSchema,
  })
  .refine(
    (data) => {
      // Si wasContacted es true, contactType es requerido
      if (data.wasContacted && !data.contactType) {
        return false;
      }
      return true;
    },
    {
      message: "El tipo de contacto es requerido cuando wasContacted es true",
      path: ["contactType"],
    }
  )
  .refine(
    (data) => {
      // Si contactType es "Carta en mano", letterType es requerido
      if (data.contactType === ContactType.LETTER_IN_HAND && !data.letterType) {
        return false;
      }
      return true;
    },
    {
      message:
        "El tipo de carta es requerido cuando contactType es 'Carta en mano'",
      path: ["letterType"],
    }
  )
  .refine(
    (data) => {
      // Si observationType es "Carta debajo puerta", letterType es requerido
      if (
        data.observationType === ObservationType.LETTER_UNDER_DOOR &&
        !data.letterType
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "El tipo de carta es requerido cuando observationType es 'Carta debajo puerta'",
      path: ["letterType"],
    }
  )
  .refine(
    (data) => {
      // plannedDate y executedDate son mutuamente excluyentes
      if (data.plannedDate && data.executedDate) {
        return false;
      }
      return true;
    },
    {
      message:
        "No se puede tener fecha planificada y ejecutada al mismo tiempo",
      path: ["plannedDate"],
    }
  );

export const followUpQuerySchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val) || 1)
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val) || 10)
    .default("10"),
  sellerId: z
    .string()
    .transform((val) => parseInt(val))
    .optional(),
  propertyId: z
    .string()
    .transform((val) => parseInt(val))
    .optional(),
  wasContacted: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  contactType: contactTypeEnum.optional(),
  observationType: observationTypeEnum.optional(),
  plannedDateFrom: z
    .string()
    .datetime("Fecha de inicio planificada inválida")
    .optional(),
  plannedDateTo: z
    .string()
    .datetime("Fecha de fin planificada inválida")
    .optional(),
  executedDateFrom: z
    .string()
    .datetime("Fecha de inicio ejecutada inválida")
    .optional(),
  executedDateTo: z
    .string()
    .datetime("Fecha de fin ejecutada inválida")
    .optional(),
  search: z.string().max(100, "Término de búsqueda muy largo").optional(),
});

export const followUpParamsSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => val > 0, {
      message: "ID de seguimiento inválido",
    }),
});

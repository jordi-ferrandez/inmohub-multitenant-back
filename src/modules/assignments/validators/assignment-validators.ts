import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentQueryParams,
  AssignmentParams,
} from "../types";
import { errorResponse } from "@core/utils/apiResponse";
import { normalizeDateToUTC, normalizeEndDateToUTC, getUserTimezone } from "@core/utils/dateUtils";

// Schema base sin transformación de fechas (se hace en el middleware)
const createAssignmentSchemaBase = z
  .object({
    userId: z
      .number()
      .int()
      .positive("ID de usuario debe ser un número positivo"),
    buildingId: z
      .number()
      .int()
      .positive("ID de edificio debe ser un número positivo"),
    type: z.enum(["Following", "Mailboxing"], {
      errorMap: () => ({ message: "Tipo de asignación inválido" }),
    }),
    startDate: z.union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
      z.string().datetime("Formato de fecha inválido (ISO 8601)"),
      z.coerce.date(),
    ]),
    endDate: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
        z.string().datetime("Formato de fecha inválido (ISO 8601)"),
        z.coerce.date(),
      ])
      .optional(),
  })
  .refine(
    (data) => {
      // Validar formato básico de fechas
      // La validación de orden se hace después de la normalización
      try {
        const startDate = data.startDate instanceof Date 
          ? data.startDate 
          : new Date(data.startDate);
        const endDate = data.endDate 
          ? (data.endDate instanceof Date ? data.endDate : new Date(data.endDate))
          : null;
        
        if (isNaN(startDate.getTime())) {
          return false;
        }
        
        if (endDate && isNaN(endDate.getTime())) {
          return false;
        }
        
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "Formato de fecha inválido",
      path: ["startDate"],
    }
  );

// Schema base sin transformación de fechas (se hace en el middleware)
const updateAssignmentSchemaBase = z
  .object({
    userId: z
      .number()
      .int()
      .positive("ID de usuario debe ser un número positivo")
      .optional(),
    buildingId: z
      .number()
      .int()
      .positive("ID de edificio debe ser un número positivo")
      .optional(),
    type: z
      .enum(["Following", "Mailboxing"], {
        errorMap: () => ({ message: "Tipo de asignación inválido" }),
      })
      .optional(),
    startDate: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
        z.string().datetime("Formato de fecha inválido (ISO 8601)"),
        z.coerce.date(),
      ])
      .optional(),
    endDate: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
        z.string().datetime("Formato de fecha inválido (ISO 8601)"),
        z.coerce.date(),
      ])
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Validar que las fechas sean válidas después de la transformación
      if (data.startDate && data.endDate) {
        const startDate = data.startDate instanceof Date ? data.startDate : new Date(data.startDate);
        const endDate = data.endDate instanceof Date ? data.endDate : new Date(data.endDate);
        return endDate >= startDate;
      }
      return true;
    },
    {
      message: "La fecha de fin debe ser igual o posterior a la fecha de inicio",
      path: ["endDate"],
    }
  );

export const assignmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  userId: z.coerce.number().int().positive().optional(),
  buildingId: z.coerce.number().int().positive().optional(),
  type: z.enum(["Following", "Mailboxing"]).optional(),
  isActive: z
    .union([z.enum(["true", "false"]), z.boolean()])
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined; // Cuando no viene el parámetro o viene un valor no reconocido
    }),
  sortBy: z
    .enum([
      "startDate",
      "endDate",
      "createdAt",
      "user.firstName",
      "building.street",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const assignmentParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID debe ser un número"),
});

export const validateCreateAssignment = (
  req: Request<{}, {}, CreateAssignmentRequest>,
  res: Response,
  next: NextFunction
) => {
  // Obtener timezone del usuario desde header (opcional)
  const userTimezone = getUserTimezone(
    req.headers["x-user-timezone"] as string
  );

  // Validar schema base
  const result = createAssignmentSchemaBase.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }

  // Normalizar fechas usando timezone del usuario
  const normalizedData = {
    ...result.data,
    startDate: normalizeDateToUTC(result.data.startDate, userTimezone),
    endDate: result.data.endDate
      ? normalizeEndDateToUTC(result.data.endDate, userTimezone)
      : normalizeEndDateToUTC(result.data.startDate, userTimezone), // Si no viene, es hasta el final de startDate
  };

  // Validar que endDate >= startDate después de normalización
  if (normalizedData.endDate && normalizedData.endDate < normalizedData.startDate) {
    errorResponse(
      res,
      "La fecha de fin debe ser igual o posterior a la fecha de inicio",
      400
    );
    return;
  }

  req.bodyValidated = normalizedData as CreateAssignmentRequest;
  next();
};

export const validateUpdateAssignment = (
  req: Request<AssignmentParams, {}, UpdateAssignmentRequest>,
  res: Response,
  next: NextFunction
) => {
  // Obtener timezone del usuario desde header (opcional)
  const userTimezone = getUserTimezone(
    req.headers["x-user-timezone"] as string
  );

  // Validar schema base
  const result = updateAssignmentSchemaBase.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }

  // Normalizar fechas usando timezone del usuario (solo si vienen)
  const normalizedData: UpdateAssignmentRequest = {
    ...(result.data.userId !== undefined && { userId: result.data.userId }),
    ...(result.data.buildingId !== undefined && { buildingId: result.data.buildingId }),
    ...(result.data.type !== undefined && { type: result.data.type }),
    ...(result.data.startDate && {
      startDate: normalizeDateToUTC(result.data.startDate, userTimezone),
    }),
    ...(result.data.endDate && {
      endDate: normalizeEndDateToUTC(result.data.endDate, userTimezone),
    }),
    ...(result.data.isActive !== undefined && { isActive: result.data.isActive }),
  };

  // Validar que endDate >= startDate después de normalización (si ambas vienen)
  if (
    normalizedData.startDate &&
    normalizedData.endDate &&
    normalizedData.endDate < normalizedData.startDate
  ) {
    errorResponse(
      res,
      "La fecha de fin debe ser igual o posterior a la fecha de inicio",
      400
    );
    return;
  }

  req.bodyValidated = normalizedData;
  next();
};

export const validateAssignmentQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("Logging req.query: ", req.query);
  const result = assignmentQuerySchema.safeParse(req.query);
  console.log("Logging result: ", result);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.queryValidated = result.data as any;
  next();
};

export const validateAssignmentParams = (
  req: Request<AssignmentParams>,
  res: Response,
  next: NextFunction
) => {
  const result = assignmentParamsSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

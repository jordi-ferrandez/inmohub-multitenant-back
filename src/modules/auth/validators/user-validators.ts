import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserRolesRequest,
  UserQueryParams,
  UserParams,
} from "../types";
import { errorResponse } from "@core/utils";

export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  firstName: z.string().min(2, "Nombre demasiado corto"),
  lastName: z.string().min(2, "Apellido demasiado corto"),
  role: z.enum(["Agent", "Director", "Mailboxer", "Responsible"], {
    errorMap: () => ({ message: "Rol inválido" }),
  }),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Teléfono inválido")
    .optional(),
  avatarUrl: z.string().url("URL de avatar inválida").optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  firstName: z.string().min(2, "Nombre demasiado corto").optional(),
  lastName: z.string().min(2, "Apellido demasiado corto").optional(),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Teléfono inválido")
    .optional(),
  avatarUrl: z.string().url("URL de avatar inválida").optional(),
  isActive: z.boolean().optional(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["firstName", "lastName", "email", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const userSearchSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

export const validateUserSearch = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = userSearchSchema.safeParse(req.query);

  if (!result.success) {
    const details = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    errorResponse(res, "Parámetros de búsqueda inválidos", 400, details);
    return;
  }
  req.queryValidated = result.data;
  next();
};

export const userParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID debe ser un número"),
});

export const validateCreateUser = (
  req: Request<{}, {}, CreateUserRequest>,
  res: Response,
  next: NextFunction
): void => {
  const result = createUserSchema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    errorResponse(res, "Datos de entrada inválidos", 400, details);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateUpdateUser = (
  req: Request<{ id: string }, {}, UpdateUserRequest>,
  res: Response,
  next: NextFunction
): void => {
  const result = updateUserSchema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    errorResponse(res, "Datos de entrada inválidos", 400, details);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

// Corregir el validador de query params
export const validateUserQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = userQuerySchema.safeParse(req.query);

  if (!result.success) {
    const details = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    errorResponse(res, "Parámetros de consulta inválidos", 400, details);
    return;
  }
  // Asegurar que los valores por defecto se apliquen
  req.queryValidated = {
    page: result.data.page,
    limit: result.data.limit,
    search: result.data.search,
    role: result.data.role,
    isActive: result.data.isActive,
    sortBy: result.data.sortBy,
    sortOrder: result.data.sortOrder,
  };
  next();
};

// Corregir el validador de params
export const validateUserParams = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = userParamsSchema.safeParse(req.params);

  if (!result.success) {
    const details = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    errorResponse(res, "Parámetros de ruta inválidos", 400, details);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

export const updateUserRolesSchema = z.object({
  roleIds: z
    .array(z.number().int().positive())
    .min(1, "Debe tener al menos un rol")
    .max(10, "No se pueden asignar más de 10 roles"),
});

export const validateUpdateUserRoles = (
  req: Request<{ id: string }, {}, UpdateUserRolesRequest>,
  res: Response,
  next: NextFunction
): void => {
  const result = updateUserRolesSchema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    errorResponse(res, "Datos de entrada inválidos", 400, details);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const updateUserPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
});

export const validateUpdateUserPassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = updateUserPasswordSchema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    errorResponse(res, "Datos de entrada inválidos", 400, details);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

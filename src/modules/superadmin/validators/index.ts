import { Request, Response, NextFunction } from "express";
import { errorResponse } from "@core/utils";
import { z } from "zod";

const createCompanySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  directorEmail: z.string().email("Email inválido"),
  directorPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  directorFirstName: z.string().min(1, "El nombre es requerido"),
  directorLastName: z.string().min(1, "El apellido es requerido"),
});

const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

const moveUserSchema = z.object({
  companyId: z.number().positive("ID de empresa inválido"),
});

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  isSuperAdmin: z.boolean().optional(),
  companyId: z.number().int().positive().nullable().optional(),
  roleIds: z.array(z.number().int().positive()).optional(),
});

const updateUserSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  firstName: z.string().min(1, "El nombre es requerido").optional(),
  lastName: z.string().min(1, "El apellido es requerido").optional(),
  // En edición la contraseña es opcional: si viene, se cambia
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  isSuperAdmin: z.boolean().optional(),
  companyId: z.number().int().positive().nullable().optional(),
  roleIds: z.array(z.number().int().positive()).optional(),
});

export function validateCreateCompany(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = createCompanySchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, "Validación fallida", 400, result.error.errors);
    return;
  }
  req.bodyValidated = result.data;
  next();
}

export function validateUpdateCompany(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = updateCompanySchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, "Validación fallida", 400, result.error.errors);
    return;
  }
  req.bodyValidated = result.data;
  next();
}

export function validateMoveUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = moveUserSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, "Validación fallida", 400, result.error.errors);
    return;
  }
  req.bodyValidated = result.data;
  next();
}

export function validateCreateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, "Validación fallida", 400, result.error.errors);
    return;
  }
  req.bodyValidated = result.data;
  next();
}

export function validateUpdateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = updateUserSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, "Validación fallida", 400, result.error.errors);
    return;
  }
  req.bodyValidated = result.data;
  next();
}

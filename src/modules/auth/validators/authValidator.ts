import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { RegisterRequest } from "../types";
import { errorResponse } from "@core/utils";

export const registerSchema = z.object({
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
    .regex(/^[0-9]+$/, "Teléfono inválido")
    .optional(),
});

export const validateRegister = (
  req: Request<{}, {}, RegisterRequest>,
  res: Response,
  next: NextFunction
): void => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    errorResponse(res, "Validation failed", 400, errors);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const validateLogin = (
  req: Request<{}, {}, { email: string; password: string }>,
  res: Response,
  next: NextFunction
): void => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    errorResponse(res, "Validation failed", 400, errors);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const validateForgotPassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = forgotPasswordSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    errorResponse(res, "Validation failed", 400, errors);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token es requerido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
});

export const validateResetPassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = resetPasswordSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    errorResponse(res, "Validation failed", 400, errors);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Contraseña actual es requerida"),
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
});

export const validateChangePassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = changePasswordSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    errorResponse(res, "Validation failed", 400, errors);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

const updateProfileSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url("URL de avatar inválida").optional().or(z.literal("")),
});

export const validateUpdateProfile = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = updateProfileSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    errorResponse(res, "Validation failed", 400, errors);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

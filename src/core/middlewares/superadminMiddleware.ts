import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils";

/**
 * Middleware que requiere rol de superadmin.
 * Debe usarse después de authenticationToken.
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;

  if (!user) {
    errorResponse(res, "Usuario no autenticado", 401);
    return;
  }

  if (!user.isSuperAdmin) {
    errorResponse(res, "Acceso denegado. Se requiere rol de Superadministrador", 403);
    return;
  }

  next();
}

/**
 * Middleware que requiere rol de director o superadmin.
 * Debe usarse después de authenticationToken.
 */
export function requireDirectorOrSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;

  if (!user || !user.roles) {
    errorResponse(res, "Usuario no autenticado", 401);
    return;
  }

  if (user.isSuperAdmin) {
    next();
    return;
  }

  const hasDirectorRole = user.roles.some(
    (role: any) => role.name === "Director"
  );

  if (!hasDirectorRole) {
    errorResponse(res, "Acceso denegado. Se requiere rol de Director", 403);
    return;
  }

  next();
}

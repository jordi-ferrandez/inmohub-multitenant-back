import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils";

export const requireDirectorRole = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as any;

  if (!user || !user.roles) {
    errorResponse(res, "Usuario no autenticado", 401);
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
};

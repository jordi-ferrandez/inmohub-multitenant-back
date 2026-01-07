import { Request, Response, NextFunction } from "express";
import { errorResponse } from "@core/utils";

export const requireAgentRole = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userRoles = req.user?.roles || [];
  const isAgent = userRoles.some((role: any) => role.name === "Agent");

  if (!isAgent) {
    errorResponse(res, "Se requieren permisos de agente", 403);
    return;
  }

  next();
};

export const requireDirectorRole = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = req.user as any;

  if (!user) {
    errorResponse(res, "Usuario no autenticado", 401);
    return;
  }

  const userRoles = user.roles || [];
  const isDirector = userRoles.some((role: any) => role.name === "Director");

  if (!isDirector) {
    console.log("User roles:", userRoles);
    console.log("Is director:", isDirector);
    errorResponse(res, "Se requieren permisos de director", 403);
    return;
  }

  next();
};

export const requireAgentOrDirectorRole = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userRoles = req.user?.roles || [];
  const isAgent = userRoles.some((role: any) => role.name === "Agent");
  const isDirector = userRoles.some((role: any) => role.name === "Director");

  if (!isAgent && !isDirector) {
    errorResponse(res, "Se requieren permisos de agente o director", 403);
    return;
  }

  next();
};

import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils";

/**
 * Middleware que establece el companyId activo para la request.
 * - Si el usuario es superadmin y envía X-Company-Id header, usa ese
 * - Si el usuario es superadmin sin header, companyId es null (ve todo)
 * - Si no es superadmin, usa su companyId del JWT
 */
export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;

  if (!user) {
    errorResponse(res, "Usuario no autenticado", 401);
    return;
  }

  if (user.isSuperAdmin) {
    const headerCompanyId = req.headers["x-company-id"];
    if (headerCompanyId) {
      req.companyId = Number(headerCompanyId);
    } else {
      req.companyId = null;
    }
    req.isSuperAdmin = true;
  } else {
    req.companyId = user.companyId ?? null;
    req.isSuperAdmin = false;
  }

  next();
}

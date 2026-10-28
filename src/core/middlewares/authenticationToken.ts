import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { errorResponse, getEnvironmentVariables } from "../utils";
import { JwtPayload } from "@modules/auth/types";

const JWT_SECRET = getEnvironmentVariables().JWT_SECRET;

function authenticationToken(req: Request, res: Response, next: NextFunction) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    errorResponse(res, "No token provided", 401);
    return;
  }
  verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      errorResponse(res, "Invalid token", 401);
      return;
    }
    const payload = decoded as JwtPayload;
    req.user = payload;
    req.companyId = payload.companyId;
    req.isSuperAdmin = payload.isSuperAdmin;
    next();
  });
}

export { authenticationToken };

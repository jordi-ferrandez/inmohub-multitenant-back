import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { errorResponse, getEnvironmentVariables } from "../utils";

interface JwtPayload {
  userId: string;
  email: string;
  roles: Array<{
    displayName: string;
    name: string;
  }>;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = getEnvironmentVariables().JWT_SECRET;

function authenticationToken(req: Request, res: Response, next: NextFunction) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    errorResponse(res, "No token provided", 401);
    return;
  }
  verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      errorResponse(res, "Invalid token", 403);
      return;
    }
    req.user = decoded as JwtPayload;
    next();
  });
}

export { authenticationToken };

import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { errorResponse } from "../utils";

const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("[Error]", err.stack);

  // Manejar diferentes tipos de errores
  if (err.name === "ValidationError") {
    errorResponse(res, "Validation Error", 400, err.message);
    return;
  }

  errorResponse(res, "Ocurrió un error inesperado", 500);
};

export { errorHandler };

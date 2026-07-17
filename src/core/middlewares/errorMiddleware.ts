import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError, ValidationError } from "../utils/AppErrors";
import { errorResponse } from "../utils";

const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("[Error]", err.stack);

  // Handle AppError instances
  if (err instanceof AppError) {
    const response: any = {
      status: "error",
      errorMessage: err.message,
    };

    if (err instanceof ValidationError && err.errors) {
      response.details = err.errors;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    const zodError = err as any;
    const errors = zodError.errors?.map((e: any) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    errorResponse(res, "Validation Error", 400, errors);
    return;
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    errorResponse(res, "Invalid token", 401);
    return;
  }

  if (err.name === "TokenExpiredError") {
    errorResponse(res, "Token expired", 401);
    return;
  }

  // Handle Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaError = err as any;
    switch (prismaError.code) {
      case "P2002":
        errorResponse(res, "Resource already exists", 409);
        return;
      case "P2025":
        errorResponse(res, "Resource not found", 404);
        return;
      default:
        errorResponse(res, "Database error", 500);
        return;
    }
  }

  // Default error
  const message = process.env.NODE_ENV === "production"
    ? "Internal server error"
    : err.message;

  errorResponse(res, message, 500);
};

export { errorHandler };

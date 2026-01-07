import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { errorResponse } from "@core/utils";

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      errorResponse(res, result.error.message, 400);
      return;
    }

    req.bodyValidated = result.data;
    next();
  };
};

export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      errorResponse(res, result.error.message, 400);
      return;
    }

    req.paramsValidated = result.data;
    next();
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      errorResponse(res, result.error.message, 400);
      return;
    }

    req.queryValidated = result.data;
    next();
  };
};


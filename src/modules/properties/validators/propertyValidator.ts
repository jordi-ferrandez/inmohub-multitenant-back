import { NextFunction, Request, Response } from "express";
import { getPropertyByIdParamSchema, patchPropertyBodySchema } from "../types";
import { errorResponse, formatZodError } from "@core/utils";
import { z } from "zod";

const getPropertyFollowUpsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  wasContacted: z.coerce.boolean().optional(),
  contactType: z.string().optional(),
  observationType: z.string().optional(),
  sellerId: z.coerce.number().int().positive().optional(),
  executedDateFrom: z.string().optional(),
  executedDateTo: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const validateGetPropertyById = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const resultParams = getPropertyByIdParamSchema.safeParse(req.params);
  if (!resultParams.success) {
    errorResponse(res, resultParams.error.message, 400);
    return;
  }
  req.paramsValidated = resultParams.data;
  next();
};

export const validatePatchPropertyById = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const resultBody = patchPropertyBodySchema.safeParse(req.body);
  if (!resultBody.success) {
    const formattedError = formatZodError(resultBody.error);
    errorResponse(res, formattedError, 400);
    return;
  }
  const resultParams = getPropertyByIdParamSchema.safeParse(req.params);
  if (!resultParams.success) {
    errorResponse(res, formatZodError(resultParams.error), 400);
    return;
  }
  req.bodyValidated = resultBody.data;
  req.paramsValidated = resultParams.data;
  next();
};

export const validateGetPropertyFollowUps = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const resultParams = getPropertyByIdParamSchema.safeParse(req.params);
  if (!resultParams.success) {
    errorResponse(res, resultParams.error.message, 400);
    return;
  }
  const resultQuery = getPropertyFollowUpsQuerySchema.safeParse(req.query);
  if (!resultQuery.success) {
    errorResponse(res, formatZodError(resultQuery.error), 400);
    return;
  }
  req.paramsValidated = resultParams.data;
  req.queryValidated = resultQuery.data;
  next();
};

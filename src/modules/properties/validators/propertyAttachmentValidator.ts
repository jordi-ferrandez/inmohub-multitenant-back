import { NextFunction, Request, Response } from "express";
import { errorResponse, formatZodError } from "@core/utils";
import {
  propertyAttachmentParamsSchema,
  propertyAttachmentCompositeParamsSchema,
  updatePropertyAttachmentSchema,
} from "../types";

export const validateGetPropertyAttachments = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = propertyAttachmentParamsSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, formatZodError(result.error), 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

export const validateUploadPropertyAttachment = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = propertyAttachmentParamsSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, formatZodError(result.error), 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

export const validateUpdatePropertyAttachment = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const paramsResult =
    propertyAttachmentCompositeParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    errorResponse(res, formatZodError(paramsResult.error), 400);
    return;
  }

  const bodyResult = updatePropertyAttachmentSchema.safeParse(req.body);
  if (!bodyResult.success) {
    errorResponse(res, formatZodError(bodyResult.error), 400);
    return;
  }

  req.paramsValidated = paramsResult.data;
  req.bodyValidated = bodyResult.data;
  next();
};

export const validateDeletePropertyAttachment = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result =
    propertyAttachmentCompositeParamsSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, formatZodError(result.error), 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};



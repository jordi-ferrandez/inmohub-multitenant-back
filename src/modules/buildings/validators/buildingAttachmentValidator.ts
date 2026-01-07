import { NextFunction, Request, Response } from "express";
import { errorResponse, formatZodError } from "@core/utils";
import {
  buildingAttachmentParamsSchema,
  buildingAttachmentCompositeParamsSchema,
  updateBuildingAttachmentSchema,
} from "../types";

export const validateGetBuildingAttachments = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = buildingAttachmentParamsSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, formatZodError(result.error), 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

export const validateUploadBuildingAttachment = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = buildingAttachmentParamsSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, formatZodError(result.error), 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

export const validateUpdateBuildingAttachment = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const paramsResult =
    buildingAttachmentCompositeParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    errorResponse(res, formatZodError(paramsResult.error), 400);
    return;
  }

  const bodyResult = updateBuildingAttachmentSchema.safeParse(req.body);
  if (!bodyResult.success) {
    errorResponse(res, formatZodError(bodyResult.error), 400);
    return;
  }

  req.paramsValidated = paramsResult.data;
  req.bodyValidated = bodyResult.data;
  next();
};

export const validateDeleteBuildingAttachment = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result =
    buildingAttachmentCompositeParamsSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, formatZodError(result.error), 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};



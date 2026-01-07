import { errorResponse } from "@core/utils";
import { NextFunction, Request, Response } from "express";
import {
  getBuildingByIdParamsSchema,
  GetBuildingsByStreetNameParams,
  getBuildingsByStreetNameParamsSchema,
  GetBuildingsByStreetNameQuery,
  getBuildingsByStreetNameQuerySchema,
  GetBuildingsQuery,
  getBuildingsQuerySchema,
  getBuildingMailboxingsParamsSchema,
  GetBuildingMailboxingsParams,
  getBuildingMailboxingsQuerySchema,
  GetBuildingMailboxingsQuery,
} from "../types/buildingTypes";

export const validateGetBuildings = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = getBuildingsQuerySchema.safeParse(req.query);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.queryValidated = result.data as GetBuildingsQuery;
  next();
};

export const validateGetBuildingsByStreetName = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const resultParams = getBuildingsByStreetNameParamsSchema.safeParse(
    req.params
  );
  if (!resultParams.success) {
    errorResponse(res, resultParams.error.message, 400);
    return;
  }
  req.paramsValidated = resultParams.data as GetBuildingsByStreetNameParams;

  const resultQuery = getBuildingsByStreetNameQuerySchema.safeParse(req.query);
  if (!resultQuery.success) {
    errorResponse(res, resultQuery.error.message, 400);
    return;
  }
  req.queryValidated = resultQuery.data as GetBuildingsByStreetNameQuery;

  next();
};

export const validateGetBuildingById = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const resultParams = getBuildingByIdParamsSchema.safeParse(req.params);
  if (!resultParams.success) {
    errorResponse(res, resultParams.error.message, 400);
    return;
  }
  req.paramsValidated = resultParams.data;
  next();
};

export const validateGetBuildingMailboxings = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const resultParams = getBuildingMailboxingsParamsSchema.safeParse(req.params);
  if (!resultParams.success) {
    errorResponse(res, resultParams.error.message, 400);
    return;
  }
  req.paramsValidated = resultParams.data as GetBuildingMailboxingsParams;

  const resultQuery = getBuildingMailboxingsQuerySchema.safeParse(req.query);
  if (!resultQuery.success) {
    errorResponse(res, resultQuery.error.message, 400);
    return;
  }
  req.queryValidated = resultQuery.data as GetBuildingMailboxingsQuery;

  next();
};

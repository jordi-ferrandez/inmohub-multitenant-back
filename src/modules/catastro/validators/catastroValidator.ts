import { errorResponse } from "@core/utils";
import { NextFunction, Request, Response } from "express";
import {
  CatastroProvinciaQuery,
  CatastroSearchQuery,
  CatastroViasQuery,
  catastroProvinciaQuerySchema,
  catastroSearchQuerySchema,
  catastroViasQuerySchema,
} from "../types";

export const validateCatastroSearch = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = catastroSearchQuerySchema.safeParse(req.query);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.queryValidated = result.data as CatastroSearchQuery;
  next();
};

export const validateCatastroMunicipios = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = catastroProvinciaQuerySchema.safeParse(req.query);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.queryValidated = result.data as CatastroProvinciaQuery;
  next();
};

export const validateCatastroVias = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = catastroViasQuerySchema.safeParse(req.query);
  if (!result.success) {
    errorResponse(res, result.error.message, 400);
    return;
  }
  req.queryValidated = result.data as CatastroViasQuery;
  next();
};

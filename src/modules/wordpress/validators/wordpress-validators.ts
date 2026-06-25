import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { errorResponse } from "@core/utils";

export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    errorResponse(res, "No se ha proporcionado ningún archivo JSON", 400);
    return;
  }
  if (!req.file.originalname.endsWith(".json") && !req.file.mimetype.includes("json")) {
    errorResponse(res, "El archivo debe ser un JSON válido", 400);
    return;
  }
  next();
};

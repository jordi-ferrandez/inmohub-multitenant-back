import { z } from "zod";
import { InmovillaCSVRecord } from "../types";
import { NextFunction, Request, Response } from "express";
import { errorResponse } from "@core/utils";

// Esquema para validar cada fila CSV
// export const csvRecordSchema = z.object({
//   Codigo: z.string().min(1, "Código es requerido"),
//   "Calle Prop": z.string().min(1, "Calle es requerida"),
//   "Calle Prop Num": z
//     .number()
//     .int("Número debe ser un entero")
//     .positive("Número debe ser positivo"),
//   "Calle Bloque": z.string().nullable(),
//   "Calle Prop esc": z.string().nullable(),
//   Puerta: z.string().nullable(),
//   "Calle prop Planta": z.string().min(1, "Planta es requerida"),
// }) satisfies z.ZodType<InmovillaCSVRecord>;

// Middleware para validar archivo CSV
export const validateCSVFile = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.file) {
    errorResponse(res, "Archivo CSV es requerido", 400);
    return;
  }

  if (req.file.mimetype !== "text/csv") {
    errorResponse(res, "Formato de archivo inválido. Solo CSV permitido", 400);
    return;
  }

  next();
};

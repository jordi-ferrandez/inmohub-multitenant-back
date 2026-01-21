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

// Middleware para validar archivo de importación (CSV o Excel)
export const validateCSVFile = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.file) {
    errorResponse(res, "Archivo es requerido", 400);
    return;
  }

  const allowedMimetypes = [
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "application/octet-stream" // A veces detectado así para CSV o Excel en algunos sistemas
  ];

  if (!allowedMimetypes.includes(req.file.mimetype)) {
    // Si el mimetype es octet-stream, verificamos la extensión como respaldo
    const extension = req.file.originalname.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["csv", "xlsx", "xls"];
    
    if (req.file.mimetype === "application/octet-stream" && extension && allowedExtensions.includes(extension)) {
      next();
      return;
    }

    errorResponse(res, "Formato de archivo inválido. Solo CSV o Excel (.xlsx, .xls) permitido", 400);
    return;
  }

  next();
};

import { Request, Response } from "express";
import { InmovillaService } from "../services/InmovillaService";
import { ImportDTO, ParsedCSVData } from "../types";
import { parseInmovillaCSV } from "../utils";
import { successResponse, errorResponse } from "@core/utils";
import fs from "fs";
import { log } from "console";

export class InmovillaController {
  private inmovillaService = new InmovillaService();

  async importCSV(req: Request, res: Response): Promise<void> {
    try {
      // Validar que se haya subido un archivo CSV
      if (!req.file) {
        errorResponse(res, "Archivo CSV es requerido", 400);
        return;
      }

      // 1. Parsear CSV (con validación de versión y estructura)
      let parsedCSVData: ParsedCSVData;
      try {
        parsedCSVData = await parseInmovillaCSV(req.file.path);
      } catch (error: any) {
        // Si el error es de validación de estructura, retornar error descriptivo
        if (error.message && error.message.includes("estructura correcta")) {
          errorResponse(
            res,
            error.message,
            400,
            { type: "validation_error" }
          );
          return;
        }
        throw error; // Re-lanzar otros errores
      }

      console.log(parsedCSVData.streets);

      // 2. Procesar registros
      const result: ImportDTO = await this.inmovillaService.importFromCSV(
        parsedCSVData
      );

      // 3. eliminar archivo temporal
      fs.unlinkSync(req.file.path);

      // 4. Preparar y enviar respuesta
      successResponse(res, result, 201);
      return;
    } catch (error: any) {
      if (req.file) {
        // Eliminar archivo temporal en caso de error
        fs.unlinkSync(req.file.path);
      }

      errorResponse(res, error.message || "Error al importar desde CSV", 500);
    }
  }
}

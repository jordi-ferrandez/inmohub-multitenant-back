import { errorResponse, successResponse } from "@core/utils";
import { Request, Response } from "express";
import { CatastroService } from "../services";
import {
  CatastroProvinciaQuery,
  CatastroSearchQuery,
  CatastroViasQuery,
} from "../types";

export class CatastroController {
  private catastroService = new CatastroService();

  /**
   * @openapi
   * /v1/catastro/provincias:
   *   get:
   *     tags: [Catastro]
   *     summary: Listado de provincias
   *     responses:
   *       200:
   *         description: Provincias con su código INE
   */
  async getProvincias(_req: Request, res: Response): Promise<void> {
    try {
      const result = await this.catastroService.getProvincias();
      successResponse(res, result, 200);
    } catch (error: any) {
      errorResponse(
        res,
        error.message || "Error al consultar las provincias de Catastro",
        error.statusCode || 500
      );
    }
  }

  /**
   * @openapi
   * /v1/catastro/municipios:
   *   get:
   *     tags: [Catastro]
   *     summary: Municipios de una provincia
   *     parameters:
   *       - in: query
   *         name: provincia
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Municipios de la provincia
   */
  async getMunicipios(req: Request, res: Response): Promise<void> {
    try {
      const { provincia } = req.queryValidated as CatastroProvinciaQuery;
      const result = await this.catastroService.getMunicipios(provincia);
      successResponse(res, result, 200);
    } catch (error: any) {
      errorResponse(
        res,
        error.message || "Error al consultar los municipios de Catastro",
        error.statusCode || 500
      );
    }
  }

  /**
   * @openapi
   * /v1/catastro/vias:
   *   get:
   *     tags: [Catastro]
   *     summary: Vías de un municipio
   *     parameters:
   *       - in: query
   *         name: provincia
   *         required: true
   *         schema: { type: string }
   *       - in: query
   *         name: municipio
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Vías del municipio
   */
  async getVias(req: Request, res: Response): Promise<void> {
    try {
      const query = req.queryValidated as CatastroViasQuery;
      const result = await this.catastroService.getVias(query);
      successResponse(res, result, 200);
    } catch (error: any) {
      errorResponse(
        res,
        error.message || "Error al consultar las vías de Catastro",
        error.statusCode || 500
      );
    }
  }

  /**
   * @openapi
   * /v1/catastro/inmueble-localizacion:
   *   get:
   *     tags: [Catastro]
   *     summary: Consulta inmuebles por provincia, municipio, vía y número
   *     parameters:
   *       - in: query
   *         name: provincia
   *         required: true
   *         schema: { type: string }
   *       - in: query
   *         name: municipio
   *         required: true
   *         schema: { type: string }
   *       - in: query
   *         name: tipoVia
   *         required: false
   *         schema: { type: string, default: CL }
   *       - in: query
   *         name: nombreVia
   *         required: true
   *         schema: { type: string }
   *       - in: query
   *         name: numero
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Datos catastrales del inmueble
   */
  async searchByAddress(req: Request, res: Response): Promise<void> {
    try {
      const query = req.queryValidated as CatastroSearchQuery;
      const result = await this.catastroService.searchByAddress(query);
      successResponse(res, result, 200);
      return;
    } catch (error: any) {
      errorResponse(
        res,
        error.message || "Error al consultar Catastro",
        error.statusCode || 500
      );
      return;
    }
  }

  async getInmuebleByRefCatastral(req: Request, res: Response): Promise<void> {
    try {
      const { refCatastral } = req.params as { refCatastral: string };
      const result = await this.catastroService.getInmuebleByrefCatastral(refCatastral);
      successResponse(res, result, 200);
      return;
    } catch (error: any) {
      errorResponse(
        res,
        error.message || "Error al consultar Catastro",
        error.statusCode || 500
      );
      return;
    }
  }
}

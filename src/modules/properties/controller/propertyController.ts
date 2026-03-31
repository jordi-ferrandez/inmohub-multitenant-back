import { errorResponse, successResponse, paginatedResponse } from "@core/utils";
import { Request, Response } from "express";
import { PropertyService } from "../services";
import FollowUpService from "@modules/followups/services/FollowUpService";
import {
  GetPropertiesQuery,
} from "../types/propertyTypes";

export class PropertyController {
  PropertyService = new PropertyService();
  /**
   * @openapi
   * /v1/properties/{id}:
   *   get:
   *     tags: [Properties]
   *     summary: Obtener detalles de una propiedad por ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Detalles de la propiedad
   */
  async getPropertyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.paramsValidated;
      const property = await this.PropertyService.getPropertyById(id);
      successResponse(res, property, 200);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener edificio", 500);
      return;
    }
  }


  /**
   * @openapi
   * /v1/properties:
   *   get:
   *     tags: [Properties]
   *     summary: Obtener lista paginada de propiedades
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lista de propiedades
   */
  async getProperty(req: Request, res: Response): Promise<void> {
    try {
      const query = req.queryValidated as GetPropertiesQuery;
      const { data, meta } = await this.PropertyService.getProperty(query);

      paginatedResponse(res, data, meta, 200);
      
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener property", 500);
      return;
    }
  }

  
  /**
   * @openapi
   * /v1/properties/{id}:
   *   patch:
   *     tags: [Properties]
   *     summary: Actualizar parcialmente una propiedad
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Propiedad actualizada
   */
  async patchPropertyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.paramsValidated;
      const data = req.bodyValidated;
      const property = await this.PropertyService.patchPropertyById(id, data);
      successResponse(res, property, 200);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al actualizar propiedad", 500);
      return;
    }
  }

  async createProperty(req: Request, res: Response): Promise<void> {
    try {
      const property = await this.PropertyService.createProperty(req.body);
      successResponse(res, property, 201);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al crear propiedad", 500);
      return;
    }
  }

  async deleteProperty(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.PropertyService.deleteProperty(Number(id));
      successResponse(res, { message: "Property deleted" }, 200);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al borrar propiedad", 500);
      return;
    }
  }


  /**
   * @openapi
   * /v1/properties/{id}/followups:
   *   get:
   *     tags: [Properties]
   *     summary: Obtener seguimientos de una propiedad específica
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de seguimientos de la propiedad
   */
  async getPropertyFollowUps(req: Request, res: Response): Promise<void> {
    try {
      const userIdStr = req.user?.userId;
      if (!userIdStr) {
        errorResponse(res, "Usuario no autenticado", 401);
        return;
      }

      const userId = parseInt(userIdStr);
      if (isNaN(userId)) {
        errorResponse(res, "ID de usuario inválido", 400);
        return;
      }

      const { id } = req.paramsValidated;
      const propertyId = parseInt(id);
      
      if (isNaN(propertyId)) {
        errorResponse(res, "ID de propiedad inválido", 400);
        return;
      }

      // Construir query params desde req.query
      const queryParams: any = {
        propertyId,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      };

      // Agregar filtros opcionales
      if (req.query.wasContacted !== undefined) {
        queryParams.wasContacted = req.query.wasContacted === "true";
      }
      if (req.query.contactType) {
        queryParams.contactType = req.query.contactType;
      }
      if (req.query.observationType) {
        queryParams.observationType = req.query.observationType;
      }
      if (req.query.sellerId) {
        queryParams.sellerId = parseInt(req.query.sellerId as string);
      }
      if (req.query.executedDateFrom) {
        queryParams.executedDateFrom = req.query.executedDateFrom;
      }
      if (req.query.executedDateTo) {
        queryParams.executedDateTo = req.query.executedDateTo;
      }
      if (req.query.search) {
        queryParams.search = req.query.search;
      }
      if (req.query.sortBy) {
        queryParams.sortBy = req.query.sortBy;
      }
      if (req.query.sortOrder) {
        queryParams.sortOrder = req.query.sortOrder;
      }

      const result = await FollowUpService.getFollowUps(queryParams, userId);

      // Formatear paginación para paginatedResponse
      const pagination = {
        totalItems: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      };

      paginatedResponse(res, result.data, pagination);
    } catch (error: any) {
      errorResponse(
        res,
        error.message || "Error al obtener seguimientos de la propiedad",
        500
      );
      return;
    }
  }
}

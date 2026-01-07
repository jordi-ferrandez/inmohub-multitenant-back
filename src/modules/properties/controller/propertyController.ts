import { errorResponse, successResponse, paginatedResponse } from "@core/utils";
import { Request, Response } from "express";
import { PropertyService } from "../services";
import FollowUpService from "@modules/followups/services/FollowUpService";

export class PropertyController {
  PropertyService = new PropertyService();
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

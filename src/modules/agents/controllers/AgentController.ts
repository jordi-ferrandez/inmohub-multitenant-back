import { Request, Response } from "express";
import { successResponse, errorResponse, paginatedResponse } from "@core/utils";
import { PaginationMetadata } from "@core/types";
import { agentService } from "../services/AgentService";
import { AvailablePropertyQueryParams } from "../types/agent-types";

export class AgentController {
  // Obtener asignaciones activas del agente
  async getActiveAssignments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        errorResponse(res, "Usuario no autenticado", 401);
        return;
      }

      const assignments = await agentService.getActiveAssignments(userId);
      successResponse(res, assignments);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  // Obtener historial de asignaciones del agente
  async getAssignmentsHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        errorResponse(res, "Usuario no autenticado", 401);
        return;
      }

      const assignments = await agentService.getAssignmentsHistory(userId);
      successResponse(res, assignments);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  // Obtener propiedades disponibles para seguimiento
  async getAvailableProperties(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        errorResponse(res, "Usuario no autenticado", 401);
        return;
      }

      const queryParams: AvailablePropertyQueryParams = {
        search: req.queryValidated?.search,
        page: req.queryValidated?.page || 1,
        limit: req.queryValidated?.limit || 50,
      };

      const result = await agentService.getAvailableProperties(
        userId,
        queryParams
      );

      // Mapear la paginación al formato esperado por PaginationMetadata
      const paginationMetadata: PaginationMetadata = {
        totalItems: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      };

      paginatedResponse(res, result.data, paginationMetadata);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  // Obtener historial de seguimientos de una propiedad específica
  async getPropertyFollowUpsHistory(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        errorResponse(res, "Usuario no autenticado", 401);
        return;
      }

      const { propertyId } = req.params;
      const propertyFollowUps = await agentService.getPropertyFollowUpsHistory(
        parseInt(propertyId),
        userId
      );
      successResponse(res, propertyFollowUps);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }
}

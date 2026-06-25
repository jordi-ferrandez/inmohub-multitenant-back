import { Request, Response } from "express";
import { AgentService } from "../services";
import { successResponse, errorResponse, paginatedResponse } from "@core/utils";
import { AvailablePropertyQueryParams } from "../../agents/types/agent-types";
import { PaginationMetadata } from "@core/types";

export class AgentController {
  /**
   * @openapi
   * /v1/followups/agents/assignments/active:
   *   get:
   *     tags: [FollowUps - Agent]
   *     summary: Obtener asignaciones activas del agente
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de asignaciones activas
   */
  async getActiveAssignments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        errorResponse(res, "Usuario no autenticado", 401);
        return;
      }

      const assignments = await AgentService.getActiveAssignments(userId);
      successResponse(res, assignments);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/followups/agents/assignments/history:
   *   get:
   *     tags: [FollowUps - Agent]
   *     summary: Obtener historial de asignaciones del agente
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de asignaciones históricas
   */
  async getAssignmentsHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        errorResponse(res, "Usuario no autenticado", 401);
        return;
      }

      const assignments = await AgentService.getAssignmentsHistory(userId);
      successResponse(res, assignments);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/followups/agents/properties/available:
   *   get:
   *     tags: [FollowUps - Agent]
   *     summary: Obtener propiedades disponibles para seguimiento
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
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
   *         description: Lista paginada de propiedades disponibles
   */
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

      const result = await AgentService.getAvailableProperties(
        userId,
        queryParams
      );

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

  /**
   * @openapi
   * /v1/followups/agents/properties/{propertyId}/followups:
   *   get:
   *     tags: [FollowUps - Agent]
   *     summary: Obtener historial de seguimientos de una propiedad
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: propertyId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Historial de seguimientos de la propiedad
   */
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

      const parsedPropertyId = parseInt(propertyId);
      if (isNaN(parsedPropertyId)) {
        errorResponse(res, "ID de propiedad inválido", 400);
        return;
      }

      const propertyFollowUps = await AgentService.getPropertyFollowUpsHistory(
        parsedPropertyId,
        userId
      );
      successResponse(res, propertyFollowUps);
    } catch (error: any) {
      console.error("Error en getPropertyFollowUpsHistory:", error);
      errorResponse(res, error.message, 400);
    }
  }
}

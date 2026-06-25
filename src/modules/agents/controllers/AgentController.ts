import { Request, Response } from "express";
import { successResponse, errorResponse, paginatedResponse } from "@core/utils";
import { PaginationMetadata } from "@core/types";
import { agentService } from "../services/AgentService";
import { AvailablePropertyQueryParams } from "../types/agent-types";

export class AgentController {
  /**
   * @openapi
   * /v1/agents/assignments/active:
   *   get:
   *     tags: [Agents]
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

      const assignments = await agentService.getActiveAssignments(userId);
      successResponse(res, assignments);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/agents/assignments/history:
   *   get:
   *     tags: [Agents]
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

      const assignments = await agentService.getAssignmentsHistory(userId);
      successResponse(res, assignments);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/agents/properties/available:
   *   get:
   *     tags: [Agents]
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
        search: (req.queryValidated as any)?.search,
        page: (req.queryValidated as any)?.page || 1,
        limit: (req.queryValidated as any)?.limit || 50,
      };

      const result = await agentService.getAvailableProperties(userId, queryParams);

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
   * /v1/agents/properties/{propertyId}/followups:
   *   get:
   *     tags: [Agents]
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
  async getPropertyFollowUpsHistory(req: Request, res: Response): Promise<void> {
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

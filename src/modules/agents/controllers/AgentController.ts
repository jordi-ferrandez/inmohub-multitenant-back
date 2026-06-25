import { Request, Response } from "express";
import { successResponse, errorResponse, paginatedResponse } from "@core/utils";
import { PaginationMetadata } from "@core/types";
import { agentService } from "../services/AgentService";
import { AvailablePropertyQueryParams } from "../types/agent-types";

export class AgentController {
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

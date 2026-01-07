import { Request, Response } from "express";
import FollowUpService from "../services/FollowUpService";
import { successResponse, errorResponse, paginatedResponse } from "@core/utils";

export class FollowUpController {
  private getUserId(req: Request, res: Response): number | null {
    const userIdStr = req.user?.userId;
    if (!userIdStr) {
      errorResponse(res, "Usuario no autenticado", 401);
      return null;
    }

    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      errorResponse(res, "ID de usuario inválido", 400);
      return null;
    }

    return userId;
  }
  async createFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const followUp = await FollowUpService.createFollowUp(req.body, userId);
      successResponse(res, followUp, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async getFollowUpById(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { id } = req.params;
      const followUp = await FollowUpService.getFollowUpById(
        parseInt(id),
        userId
      );
      successResponse(res, followUp);
    } catch (error: any) {
      errorResponse(res, error.message, 404);
    }
  }

  async getFollowUps(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const result = await FollowUpService.getFollowUps(
        req.query as any,
        userId
      );

      // Si el resultado tiene paginación, usar paginatedResponse
      if (
        result &&
        typeof result === "object" &&
        "data" in result &&
        "pagination" in result
      ) {
        // Asegurar que la paginación tenga el formato correcto
        const pagination = result.pagination as any;
        const formattedPagination = {
          totalItems: pagination.total || pagination.totalItems || 0,
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          totalPages: pagination.totalPages || 1,
        };
        paginatedResponse(res, result.data, formattedPagination);
      } else {
        successResponse(res, result);
      }
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async updateFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { id } = req.params;
      const followUp = await FollowUpService.updateFollowUp(
        parseInt(id),
        req.body,
        userId
      );
      successResponse(res, followUp);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async deleteFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { id } = req.params;
      await FollowUpService.deleteFollowUp(parseInt(id), userId);
      res.status(204).send();
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async getFollowUpStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const stats = await FollowUpService.getFollowUpStats(userId);
      successResponse(res, stats);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async getDirectorsFollowUpOverview(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const overview = await FollowUpService.getDirectorsFollowUpOverview(
        userId
      );
      successResponse(res, overview);
    } catch (error: any) {
      errorResponse(res, error.message, 403);
    }
  }

  async completeFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { id } = req.params;
      const followUp = await FollowUpService.completeFollowUp(
        parseInt(id),
        userId
      );
      successResponse(res, followUp);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async getPlannedFollowUps(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      // El userId del query params es opcional para directores
      const targetUserId = req.query.userId
        ? parseInt(req.query.userId as string)
        : userId;

      const followUps = await FollowUpService.getPlanned(targetUserId);
      successResponse(res, followUps);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async getCompletedFollowUps(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      // El userId del query params es opcional para directores
      const targetUserId = req.query.userId
        ? parseInt(req.query.userId as string)
        : userId;

      const followUps = await FollowUpService.getCompleted(targetUserId);
      successResponse(res, followUps);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }
}

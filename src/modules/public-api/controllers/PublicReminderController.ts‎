import { Request, Response } from 'express';
import { prisma } from '@core/lib';
import { publicApiService } from '../services/PublicApiService';
import { successResponse, errorResponse, paginatedResponse } from '@core/utils';

export class PublicReminderController {
  
  /**
   * @openapi
   * /public/v1/tasks:
   *   get:
   *     tags: [Public API - Tasks]
   *     summary: List all tasks (reminders)
   *     security:
   *       - ApiKeyAuth: []
   */
  async getAll(req: Request, res: Response) {
    try {
      const companyId = req.apiKey.companyId;
      const result = await publicApiService.findMany(prisma.reminder, companyId, req.query);
      const pagination = {
        totalItems: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      };
      paginatedResponse(res, result.data, pagination);
    } catch (error: any) {
      errorResponse(res, error.message || 'Error fetching tasks', 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.apiKey.companyId;
      const task = await publicApiService.findOne(prisma.reminder, id, companyId, req.query.include);
      successResponse(res, task);
    } catch (error: any) {
      errorResponse(res, error.message || 'Task not found', 404);
    }
  }
}

export const publicReminderController = new PublicReminderController();
import { Request, Response } from 'express';
import { prisma } from '@core/lib';
import { publicApiService } from '../services/PublicApiService';
import { successResponse, errorResponse, paginatedResponse } from '@core/utils';

export class PublicFollowUpController {
  
  /**
   * @openapi
   * /public/v1/followups:
   *   get:
   *     tags: [Public API - FollowUps]
   *     summary: List all follow-ups (visits, calls, etc.)
   *     security:
   *       - ApiKeyAuth: []
   */
  async getAll(req: Request, res: Response) {
    try {
      const companyId = req.apiKey.companyId;
      const result = await publicApiService.findMany(prisma.followUp, companyId, req.query);
      const pagination = {
        totalItems: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      };
      paginatedResponse(res, result.data, pagination);
    } catch (error: any) {
      errorResponse(res, error.message || 'Error fetching follow-ups', 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.apiKey.companyId;
      const followUp = await publicApiService.findOne(prisma.followUp, id, companyId, req.query.include);
      successResponse(res, followUp);
    } catch (error: any) {
      errorResponse(res, error.message || 'Follow-up not found', 404);
    }
  }
}

export const publicFollowUpController = new PublicFollowUpController();
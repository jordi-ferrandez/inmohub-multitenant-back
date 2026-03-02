import { Request, Response } from 'express';
import { prisma } from '@core/lib';
import { publicApiService } from '../services/PublicApiService';
import { successResponse, errorResponse, paginatedResponse } from '@core/utils';

export class PublicPersonController {
  /**
   * @openapi
   * /public/v1/contacts:
   *   get:
   *     tags: [Public API - Contacts]
   *     summary: List all contacts (persons)
   *     security:
   *       - ApiKeyAuth: []
   */
  async getAll(req: Request, res: Response) {
    try {
      const companyId = req.apiKey.companyId;
      const result = await publicApiService.findMany(
        prisma.person,
        companyId,
        req.query,
      );
      const pagination = {
        totalItems: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      };
      paginatedResponse(res, result.data, pagination);
    } catch (error: any) {
      errorResponse(res, error.message || 'Error fetching contacts', 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.apiKey.companyId;
      const person = await publicApiService.findOne(
        prisma.person,
        id,
        companyId,
        req.query.include,
      );
      successResponse(res, person);
    } catch (error: any) {
      errorResponse(res, error.message || 'Contact not found', 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      const companyId = req.apiKey.companyId;
      const person = await prisma.person.create({
        data: { ...data, companyId },
      });
      successResponse(res, person, 201);
    } catch (error: any) {
      errorResponse(res, error.message || 'Error creating contact', 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const companyId = req.apiKey.companyId;
      await publicApiService.findOne(prisma.person, id, companyId);
      const person = await prisma.person.update({
        where: { id },
        data,
      });
      successResponse(res, person);
    } catch (error: any) {
      errorResponse(res, error.message || 'Error updating contact', 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.apiKey.companyId;
      await publicApiService.findOne(prisma.person, id, companyId);
      await prisma.person.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      successResponse(res, { message: 'Contact deleted successfully' });
    } catch (error: any) {
      errorResponse(res, error.message || 'Error deleting contact', 400);
    }
  }
}

export const publicPersonController = new PublicPersonController();

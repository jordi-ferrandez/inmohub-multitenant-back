import { Request, Response } from 'express';
import { apiKeyService } from '../services/ApiKeyService';
import { companyService } from '../services/CompanyService';
import { successResponse, errorResponse } from '@core/utils';

export class ApiKeyController {
  /**
   * @openapi
   * /v1/api-keys/companies:
   *   post:
   *     tags: [Admin - API Keys]
   *     summary: Create a new company (tenant)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name]
   *             properties:
   *               name:
   *                 type: string
   *     responses:
   *       201:
   *         description: Company created
   */
  async createCompany(req: Request, res: Response) {
    try {
      const { name } = req.body;
      const company = await companyService.createCompany(name);
      successResponse(res, company, 201);
    } catch (error: any) {
      errorResponse(res, error.message || 'Error creating company', 400);
    }
  }

  /**
   * @openapi
   * /v1/api-keys:
   *   post:
   *     tags: [Admin - API Keys]
   *     summary: Generate a new API Key
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [companyId, name]
   *             properties:
   *               companyId:
   *                 type: integer
   *               name:
   *                 type: string
   *               scopes:
   *                 type: array
   *                 items:
   *                   type: string
   *               expiresAt:
   *                 type: string
   *                 format: date-time
   *               restrictedIps:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: API Key generated (shows raw key only once)
   */
  async createKey(req: Request, res: Response) {
    try {
      const { companyId, name, scopes, expiresAt, restrictedIps } = req.body;
      const userId = (req.user as any).userId;

      const result = await apiKeyService.createApiKey({
        userId: parseInt(userId),
        companyId: companyId ? parseInt(companyId) : undefined,
        name,
        scopes,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        restrictedIps,
      });
      successResponse(res, result, 201);
    } catch (error: any) {
      errorResponse(res, error.message || 'Error creating API Key', 400);
    }
  }

  /**
   * @openapi
   * /v1/api-keys/company/{companyId}:
   *   get:
   *     tags: [Admin - API Keys]
   *     summary: List API Keys for a company
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: List of API Keys
   */
  async listKeys(req: Request, res: Response) {
    try {
      const userId = (req.user as any).userId;
      const keys = await apiKeyService.listApiKeys(parseInt(userId));
      successResponse(res, keys);
    } catch (error: any) {
      errorResponse(res, error.message || 'Error listing API Keys', 400);
    }
  }

  /**
   * @openapi
   * /v1/api-keys/{id}/revoke:
   *   post:
   *     tags: [Admin - API Keys]
   *     summary: Revoke an API Key
   *     security:
   *       - bearerAuth: []
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
   *             required: [companyId]
   *     responses:
   *       200:
   *         description: API Key revoked
   */
  async revokeKey(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req.user as any).userId;
      await apiKeyService.revokeApiKey(parseInt(id), parseInt(userId));
      successResponse(res, { message: 'API Key revoked' });
    } catch (error: any) {
      errorResponse(res, error.message || 'Error revoking API Key', 400);
    }
  }
}

export const apiKeyController = new ApiKeyController();

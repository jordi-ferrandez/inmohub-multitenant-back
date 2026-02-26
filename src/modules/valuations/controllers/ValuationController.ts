import { Request, Response } from "express";
import { valuationService } from "../services/ValuationService";
import { successResponse, errorResponse } from "@core/utils";
import { CreateValuationRequest } from "../types";

export class ValuationController {
  
  /**
   * @openapi
   * /v1/valuations/widget/{slug}:
   *   get:
   *     tags: [Valuations]
   *     summary: Get widget configuration by slug
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Widget configuration details
   */
  async getWidgetConfig(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const config = await valuationService.getWidgetConfig(slug);
      successResponse(res, config);
    } catch (error: any) {
      errorResponse(res, error.message, 404);
    }
  }

  /**
   * @openapi
   * /v1/valuations/process:
   *   post:
   *     tags: [Valuations]
   *     summary: Process a property valuation
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               slug:
   *                 type: string
   *               property:
   *                 type: object
   *               contact:
   *                 type: object
   *     responses:
   *       200:
   *         description: Valuation result
   */
  async processValuation(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateValuationRequest = req.body;
      const result = await valuationService.processValuation(data);
      successResponse(res, result);
    } catch (error: any) {
      console.error("Valuation Error:", error);
      errorResponse(res, error.message || "Error processing valuation", 500);
    }
  }

  /**
   * @openapi
   * /v1/valuations/internal:
   *   post:
   *     tags: [Valuations]
   *     summary: Create an internal valuation (Agent)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               property:
   *                 type: object
   *               propertyId:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Valuation result
   */
  async createInternalValuation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        errorResponse(res, "Usuario no autenticado", 401);
        return;
      }
      
      const data = req.body;
      const result = await valuationService.createInternalValuation(data, parseInt(userId));
      successResponse(res, result);
    } catch (error: any) {
      console.error("Internal Valuation Error:", error);
      errorResponse(res, error.message || "Error creating valuation", 500);
    }
  }
}

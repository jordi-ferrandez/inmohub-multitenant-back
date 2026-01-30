import { Request, Response } from "express";
import { activityService } from "../services";
import { successResponse, errorResponse } from "@core/utils";
import { ActivityItemsQueryParams } from "../types";

export class ActivityController {
  /**
   * @openapi
   * /v1/activity/report:
   *   get:
   *     tags: [Activity]
   *     summary: Obtener reporte de actividad (estadísticas)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Reporte de actividad
   */
  async getActivityReport(req: Request, res: Response): Promise<void> {
    try {
      const query = req.queryValidated as any;
      const report = await activityService.getActivityReport(query);
      successResponse(res, report);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/activity/items:
   *   get:
   *     tags: [Activity]
   *     summary: Obtener listado de items de actividad (timeline)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de items de actividad
   */
  async getActivityItems(req: Request, res: Response): Promise<void> {
    try {
      const query = req.queryValidated as ActivityItemsQueryParams;
      const items = await activityService.getActivityItems(query);
      successResponse(res, items);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }
}


import { Request, Response } from "express";
import { activityService } from "../services";
import { successResponse, errorResponse } from "@core/utils";
import { ActivityItemsQueryParams } from "../types";

export class ActivityController {
  async getActivityReport(req: Request, res: Response): Promise<void> {
    try {
      const query = req.queryValidated as any;
      const report = await activityService.getActivityReport(query);
      successResponse(res, report);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

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


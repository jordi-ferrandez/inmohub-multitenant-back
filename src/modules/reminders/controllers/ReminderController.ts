import { Request, Response } from "express";
import { reminderService } from "../services/ReminderService";
import {
  AgendaQueryParams,
  CreateReminderRequest,
  ReminderQueryParams,
  UpdateOccurrenceStatusRequest,
  UpdateReminderRequest,
} from "../types";
import { successResponse, errorResponse } from "@core/utils";

class ReminderController {
  private extractUserId(req: Request, res: Response): number | null {
    const userIdStr = req.user?.userId;
    if (!userIdStr) {
      errorResponse(res, "Usuario no autenticado", 401);
      return null;
    }
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      errorResponse(res, "ID de usuario inválido", 400);
      return null;
    }
    return userId;
  }

  async createReminder(
    req: Request<{}, {}, CreateReminderRequest>,
    res: Response
  ) {
    try {
      const userId = this.extractUserId(req, res);
      if (userId === null) return;

      const reminder = await reminderService.createReminder(
        req.bodyValidated || req.body,
        userId
      );
      successResponse(res, reminder, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async getReminders(req: Request, res: Response) {
    try {
      const userId = this.extractUserId(req, res);
      if (userId === null) return;

      const result = await reminderService.getReminders(
        (req.queryValidated as ReminderQueryParams) || (req.query as any),
        userId
      );
      successResponse(res, result, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }

  async getReminder(req: Request, res: Response) {
    try {
      const userId = this.extractUserId(req, res);
      if (userId === null) return;

      const idParam = (req.paramsValidated?.id || req.params.id) as string;
      const id = parseInt(idParam, 10);

      const reminder = await reminderService.getReminderById(id, userId);
      successResponse(res, reminder, 200);
    } catch (error: any) {
      const status = error.message === "Recordatorio no encontrado" ? 404 : 400;
      errorResponse(res, error.message, status);
    }
  }

  async updateReminder(
    req: Request,
    res: Response
  ) {
    try {
      const userId = this.extractUserId(req, res);
      if (userId === null) return;

      const idParam = (req.paramsValidated?.id || req.params.id) as string;
      const id = parseInt(idParam, 10);

      const reminder = await reminderService.updateReminder(
        id,
        req.bodyValidated || req.body,
        userId
      );

      successResponse(res, reminder, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async changeStatus(req: Request, res: Response) {
    try {
      const userId = this.extractUserId(req, res);
      if (userId === null) return;

      const idParam = (req.paramsValidated?.id || req.params.id) as string;
      const id = parseInt(idParam, 10);
      const { status } = req.bodyValidated || req.body;

      const reminder = await reminderService.changeStatus(id, status, userId);
      successResponse(res, reminder, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async deleteReminder(req: Request, res: Response) {
    try {
      const userId = this.extractUserId(req, res);
      if (userId === null) return;

      const idParam = (req.paramsValidated?.id || req.params.id) as string;
      const id = parseInt(idParam, 10);

      await reminderService.deleteReminder(id, userId);
      successResponse(res, null, 204);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async getAgenda(req: Request, res: Response) {
    try {
      const userId = this.extractUserId(req, res);
      if (userId === null) return;

      const result = await reminderService.getAgenda(
        (req.queryValidated as AgendaQueryParams) || (req.query as any),
        userId
      );
      successResponse(res, result, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async getOccurrences(req: Request, res: Response) {
    try {
      const userId = this.extractUserId(req, res);
      if (userId === null) return;

      const reminderIdParam =
        (req.paramsValidated?.id ||
          req.paramsValidated?.reminderId ||
          req.params.reminderId ||
          req.params.id) as string;

      const reminderId = parseInt(reminderIdParam, 10);

      const occurrences = await reminderService.getOccurrencesByReminder(
        reminderId,
        userId
      );
      successResponse(res, occurrences, 200);
    } catch (error: any) {
      const status = error.message.includes("no encontrado") ? 404 : 400;
      errorResponse(res, error.message, status);
    }
  }

  async updateOccurrence(req: Request, res: Response) {
    try {
      const userId = this.extractUserId(req, res);
      if (userId === null) return;

      const reminderIdParam =
        (req.paramsValidated?.reminderId ||
          req.params.reminderId ||
          req.params.id) as string;
      const occurrenceIdParam =
        (req.paramsValidated?.occurrenceId || req.params.occurrenceId) as string;

      const reminderId = parseInt(reminderIdParam, 10);
      const occurrenceId = parseInt(occurrenceIdParam, 10);

      const occurrence = await reminderService.updateOccurrenceStatus(
        reminderId,
        occurrenceId,
        (req.bodyValidated || req.body) as UpdateOccurrenceStatusRequest,
        userId
      );
      successResponse(res, occurrence, 200);
    } catch (error: any) {
      const status = error.message.includes("no encontrado") ? 404 : 400;
      errorResponse(res, error.message, status);
    }
  }
}

export const reminderController = new ReminderController();


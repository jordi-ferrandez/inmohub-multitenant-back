import { Request, Response } from "express";
import { prisma } from "@core/lib";
import { notificationService } from "../services/NotificationService";
import { successResponse, errorResponse } from "@core/utils";

class NotificationController {
  async sendNotification(req: Request, res: Response) {
    try {
      const { personId, channel, subject, message } = req.bodyValidated || req.body;

      const result = await notificationService.sendNotification(
        personId,
        channel,
        subject,
        message
      );

      if (!result.success) {
        errorResponse(res, result.error || "Error al enviar notificación", 400);
        return;
      }

      successResponse(res, result, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }

  async sendBulkNotification(req: Request, res: Response) {
    try {
      const { personIds, channel, subject, message } = req.bodyValidated || req.body;

      const results = await Promise.all(
        personIds.map((personId: number) =>
          notificationService.sendNotification(personId, channel, subject, message)
        )
      );

      const failed = results.filter(r => !r.success);

      successResponse(res, {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: failed.length,
        details: results,
      }, failed.length === 0 ? 200 : 207);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }

  async triggerPropertyVisitNotification(req: Request, res: Response) {
    try {
      const { followUpId } = req.paramsValidated || req.params;
      const id = typeof followUpId === "string" ? parseInt(followUpId, 10) : followUpId;

      await notificationService.notifyPropertyVisit(id);
      successResponse(res, { message: "Notificaciones enviadas correctamente" }, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }

  async getPersonPreferences(req: Request, res: Response) {
    try {
      const personId = parseInt(req.params.personId, 10);
      const person = await prisma.person.findUnique({
        where: { id: personId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          notificationPreference: true,
          phones: {
            select: { id: true, phone: true, type: true },
          },
        },
      });

      if (!person) {
        errorResponse(res, "Persona no encontrada", 404);
        return;
      }

      successResponse(res, person, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }

  async updatePersonPreferences(req: Request, res: Response) {
    try {
      const personId = parseInt(req.params.personId, 10);
      const { notificationPreference } = req.bodyValidated || req.body;

      const updated = await prisma.person.update({
        where: { id: personId },
        data: { notificationPreference },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          notificationPreference: true,
        },
      });

      successResponse(res, updated, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }
}

export const notificationController = new NotificationController();

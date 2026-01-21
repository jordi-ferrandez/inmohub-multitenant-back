import { errorResponse, successResponse } from "@core/utils";
import { Request, Response } from "express";
import { FlyerService } from "../services/FlyerService";

export class FlyerController {
  private flyerService = new FlyerService();

  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = await this.flyerService.getTemplates();
      successResponse(res, templates, 200);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener plantillas", 500);
    }
  }

  async getPropertyFlyers(req: Request, res: Response): Promise<void> {
    try {
      const propertyId = parseInt(req.params.propertyId);
      if (isNaN(propertyId)) {
        errorResponse(res, "ID de propiedad inválido", 400);
        return;
      }
      const flyers = await this.flyerService.getFlyersByProperty(propertyId);
      successResponse(res, flyers, 200);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener flyers", 500);
    }
  }

  async createFlyer(req: Request, res: Response): Promise<void> {
    try {
      const { propertyId, templateId, qrContent } = req.body;
      const userId = (req as any).user?.userId;

      if (!propertyId || !templateId || !qrContent) {
        errorResponse(res, "Faltan datos requeridos", 400);
        return;
      }

      if (!userId) {
        errorResponse(res, "Usuario no autenticado", 401);
        return;
      }

      const flyer = await this.flyerService.createFlyer({
        propertyId: parseInt(propertyId),
        templateId: parseInt(templateId),
        generatedById: parseInt(userId),
        qrContent,
      });

      successResponse(res, flyer, 201);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al crear flyer", 500);
    }
  }

  async shipFlyer(req: Request, res: Response): Promise<void> {
    try {
      const flyerId = parseInt(req.params.id);
      const userId = (req as any).user?.userId;
      const { notes } = req.body;

      if (isNaN(flyerId)) {
        errorResponse(res, "ID de flyer inválido", 400);
        return;
      }

      if (!userId) {
        errorResponse(res, "Usuario no autenticado", 401);
        return;
      }

      const shipment = await this.flyerService.recordShipment(
        flyerId,
        parseInt(userId),
        notes
      );

      successResponse(res, shipment, 201);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al registrar envío", 500);
    }
  }

  async getFlyerShipments(req: Request, res: Response): Promise<void> {
    try {
      const flyerId = parseInt(req.params.id);
      if (isNaN(flyerId)) {
        errorResponse(res, "ID de flyer inválido", 400);
        return;
      }
      const shipments = await this.flyerService.getShipmentsByFlyer(flyerId);
      successResponse(res, shipments, 200);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener envíos", 500);
    }
  }
}

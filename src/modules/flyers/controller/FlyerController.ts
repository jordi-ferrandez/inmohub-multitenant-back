import { errorResponse, successResponse } from "@core/utils";
import { Request, Response } from "express";
import { FlyerService } from "../services/FlyerService";

export class FlyerController {
  private flyerService = new FlyerService();

  /**
   * @openapi
   * /v1/flyers/templates:
   *   get:
   *     tags: [Flyers]
   *     summary: Obtener todas las plantillas de flyers
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de plantillas
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = await this.flyerService.getTemplates();
      successResponse(res, templates, 200);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener plantillas", 500);
    }
  }

  /**
   * @openapi
   * /v1/flyers/property/{propertyId}:
   *   get:
   *     tags: [Flyers]
   *     summary: Obtener flyers de una propiedad
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: propertyId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de flyers de la propiedad
   */
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

  /**
   * @openapi
   * /v1/flyers:
   *   post:
   *     tags: [Flyers]
   *     summary: Crear un nuevo flyer
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               propertyId:
   *                 type: integer
   *               templateId:
   *                 type: integer
   *               qrContent:
   *                 type: string
   *     responses:
   *       201:
   *         description: Flyer creado
   */
  async createFlyer(req: Request, res: Response): Promise<void> {
    try {
      const body = req.bodyValidated || req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        errorResponse(res, "Usuario no autenticado", 401);
        return;
      }

      const flyer = await this.flyerService.createFlyer({
        propertyId: body.propertyId,
        templateId: body.templateId,
        generatedById: parseInt(userId),
        qrContent: body.qrContent,
      });

      successResponse(res, flyer, 201);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al crear flyer", 500);
    }
  }

  /**
   * @openapi
   * /v1/flyers/{id}/ship:
   *   post:
   *     tags: [Flyers]
   *     summary: Registrar envío de un flyer
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
   *             properties:
   *               notes:
   *                 type: string
   *     responses:
   *       201:
   *         description: Envío registrado
   */
  async shipFlyer(req: Request, res: Response): Promise<void> {
    try {
      const flyerId = parseInt(req.params.id);
      const userId = (req as any).user?.userId;
      const { notes } = req.bodyValidated || req.body;

      if (isNaN(flyerId)) {
        errorResponse(res, "ID de flyer inválido", 400);
        return;
      }

      if (!userId) {
        errorResponse(res, "Usuario no autenticado", 401);
        return;
      }

      const shipment = await this.flyerService.recordShipment(flyerId, parseInt(userId), notes);
      successResponse(res, shipment, 201);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al registrar envío", 500);
    }
  }

  /**
   * @openapi
   * /v1/flyers/{id}/shipments:
   *   get:
   *     tags: [Flyers]
   *     summary: Obtener envíos de un flyer
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de envíos del flyer
   */
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

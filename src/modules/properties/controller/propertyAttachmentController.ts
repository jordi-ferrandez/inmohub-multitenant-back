import { Request, Response } from "express";
import { PropertyAttachmentService } from "../services";
import { errorResponse, successResponse } from "@core/utils";

export class PropertyAttachmentController {
  private readonly service = new PropertyAttachmentService();

  private getUserId(req: Request, res: Response): number | null {
    const userIdStr = req.user?.userId;
    if (!userIdStr) {
      errorResponse(res, "Usuario no autenticado", 401);
      return null;
    }

    const userId = parseInt(userIdStr, 10);
    if (Number.isNaN(userId)) {
      errorResponse(res, "ID de usuario inválido", 400);
      return null;
    }

    return userId;
  }

  /**
   * @openapi
   * /v1/properties/{id}/attachments:
   *   get:
   *     tags: [Properties]
   *     summary: Listar archivos adjuntos de una propiedad
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de adjuntos
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.paramsValidated;
      const attachments = await this.service.list(id);
      successResponse(res, attachments);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener adjuntos", 400);
    }
  }

  /**
   * @openapi
   * /v1/properties/{id}/attachments:
   *   post:
   *     tags: [Properties]
   *     summary: Subir un archivo adjunto a una propiedad
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *     responses:
   *       201:
   *         description: Archivo subido
   */
  async upload(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      if (!req.file) {
        errorResponse(res, "Debe proporcionar un archivo", 400);
        return;
      }

      const { id } = req.paramsValidated;
      const attachment = await this.service.create(id, req.file, userId);
      successResponse(res, attachment, 201);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al subir adjunto", 400);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id, attachmentId } = req.paramsValidated;
      const body = req.bodyValidated;
      const attachment = await this.service.update(id, attachmentId, body);
      successResponse(res, attachment);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al actualizar adjunto", 400);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id, attachmentId } = req.paramsValidated;
      await this.service.delete(id, attachmentId);
      successResponse(res, { message: "Adjunto eliminado correctamente" });
    } catch (error: any) {
      errorResponse(res, error.message || "Error al eliminar adjunto", 400);
    }
  }
}



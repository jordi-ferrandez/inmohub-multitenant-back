import { Request, Response } from "express";
import MailboxingService from "../services/MailboxingService";
import { successResponse, errorResponse, paginatedResponse } from "@core/utils";

export class MailboxingController {
  private isDirector(req: Request): boolean {
    const user = req.user as any;
    return user?.roles?.some((role: any) => role.name === "Director") || false;
  }

  private getUserId(req: Request, res: Response): number | null {
    const userIdStr = req.user?.userId;
    if (!userIdStr) {
      errorResponse(res, "Usuario no autenticado", 401);
      return null;
    }

    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      errorResponse(res, "ID de usuario inválido", 400);
      return null;
    }

    return userId;
  }

  /**
   * @openapi
   * /v1/mailboxing:
   *   post:
   *     tags: [Mailboxing]
   *     summary: Registrar una actividad de buzoneo
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               assignmentId:
   *                 type: integer
   *               status:
   *                 type: string
   *     responses:
   *       201:
   *         description: Actividad registrada
   */
  async createMailboxing(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const isDirector = this.isDirector(req);
      const targetMailboxerId = (isDirector && req.body.mailboxerId) 
        ? req.body.mailboxerId 
        : userId;

      const mailboxing = await MailboxingService.createMailboxing(
        req.body,
        targetMailboxerId,
        req.companyId ?? null
      );
      successResponse(res, mailboxing, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async getMailboxingById(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { id } = req.params;
      const mailboxing = await MailboxingService.getMailboxingById(
        parseInt(id),
        userId
      );
      successResponse(res, mailboxing);
    } catch (error: any) {
      errorResponse(res, error.message, 404);
    }
  }

  /**
   * @openapi
   * /v1/mailboxing:
   *   get:
   *     tags: [Mailboxing]
   *     summary: Obtener lista paginada de actividades de buzoneo
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de actividades
   */
  async getMailboxings(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const isDirector = this.isDirector(req);

      // Usar queryValidated en lugar de query para usar los datos validados
      const query = req.queryValidated as any;

      const result = await MailboxingService.getMailboxings(
        query || {},
        userId,
        isDirector
      );

      paginatedResponse(res, result.data, {
        totalItems: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      });
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/mailboxing/{id}:
   *   put:
   *     tags: [Mailboxing]
   *     summary: Actualizar una actividad de buzoneo
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
   *     responses:
   *       200:
   *         description: Actividad actualizada
   */
  async updateMailboxing(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { id } = req.params;
      const isDirector = this.isDirector(req);

      const mailboxing = await MailboxingService.updateMailboxing(
        parseInt(id),
        req.body,
        userId,
        isDirector
      );
      successResponse(res, mailboxing);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/mailboxing/{id}:
   *   delete:
   *     tags: [Mailboxing]
   *     summary: Eliminar una actividad de buzoneo
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
   *         description: Actividad eliminada
   */
  async deleteMailboxing(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { id } = req.params;
      await MailboxingService.deleteMailboxing(parseInt(id), userId);
      successResponse(res, {
        message: "Buzoneamiento eliminado correctamente",
      });
    } catch (error: any) {
      errorResponse(res, error.message, 404);
    }
  }

  /**
   * @openapi
   * /v1/mailboxing/assignments:
   *   get:
   *     tags: [Mailboxing]
   *     summary: Obtener asignaciones de buzoneo activas para el usuario
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de asignaciones activas
   */
  async getActiveAssignments(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const assignments = await MailboxingService.getActiveAssignments(userId);
      successResponse(res, assignments);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/mailboxing/{mailboxingId}/attachments:
   *   post:
   *     tags: [Mailboxing]
   *     summary: Subir un archivo adjunto a una actividad de buzoneo
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: mailboxingId
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
  async uploadAttachment(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { mailboxingId } = req.paramsValidated;
      const file = req.file;

      if (!file) {
        errorResponse(res, "No se proporcionó ningún archivo", 400);
        return;
      }

      const attachment = await MailboxingService.uploadAttachment(
        Number(mailboxingId),
        file,
        userId
      );
      successResponse(res, attachment, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async listAttachments(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { mailboxingId } = req.paramsValidated;
      const isDirector = this.isDirector(req);
      const attachments = await MailboxingService.listAttachments(
        Number(mailboxingId),
        userId,
        isDirector
      );
      successResponse(res, attachments);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async updateAttachment(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { mailboxingId, attachmentId } = req.paramsValidated;
      const body = req.bodyValidated;
      const isDirector = this.isDirector(req);

      const attachment = await MailboxingService.updateAttachment(
        Number(mailboxingId),
        Number(attachmentId),
        userId,
        body,
        isDirector
      );

      successResponse(res, attachment);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async deleteAttachment(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { mailboxingId, attachmentId } = req.paramsValidated;
      const isDirector = this.isDirector(req);
      await MailboxingService.deleteAttachment(
        Number(mailboxingId),
        Number(attachmentId),
        userId,
        isDirector
      );
      successResponse(res, { message: "Archivo eliminado correctamente" });
    } catch (error: any) {
      errorResponse(res, error.message, 404);
    }
  }

  async getMailboxingStats(req: Request, res: Response): Promise<void> {
    try {
      const isDirector = this.isDirector(req);

      if (!isDirector) {
        errorResponse(res, "Acceso denegado. Se requiere rol de Director", 403);
        return;
      }

      const stats = await MailboxingService.getMailboxingStats();
      successResponse(res, stats);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }
}

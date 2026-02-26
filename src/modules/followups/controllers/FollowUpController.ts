// @ts-nocheck
import { Request, Response } from "express";
import FollowUpService from "../services/FollowUpService";
import { successResponse, errorResponse, paginatedResponse } from "@core/utils";

export class FollowUpController {
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
   * /v1/followups:
   *   post:
   *     tags: [FollowUps]
   *     summary: Crear un nuevo seguimiento
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
   *               wasContacted:
   *                 type: boolean
   *               comment:
   *                 type: string
   *     responses:
   *       201:
   *         description: Seguimiento creado
   */
  async createFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const followUp = await FollowUpService.createFollowUp(req.body, userId);
      successResponse(res, followUp, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/followups/{id}:
   *   get:
   *     tags: [FollowUps]
   *     summary: Obtener un seguimiento por ID
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
   *         description: Detalles del seguimiento
   */
  async getFollowUpById(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { id } = req.params;
      const followUp = await FollowUpService.getFollowUpById(
        parseInt(id),
        userId
      );
      successResponse(res, followUp);
    } catch (error: any) {
      errorResponse(res, error.message, 404);
    }
  }

  /**
   * @openapi
   * /v1/followups:
   *   get:
   *     tags: [FollowUps]
   *     summary: Obtener lista paginada de seguimientos
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
   *         description: Lista de seguimientos (del usuario activo o filtrada)
   */
  async getFollowUps(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const result = await FollowUpService.getFollowUps(
        req.query as any,
        userId
      );

      // Si el resultado tiene paginación, usar paginatedResponse
      if (
        result &&
        typeof result === "object" &&
        "data" in result &&
        "pagination" in result
      ) {
        // Asegurar que la paginación tenga el formato correcto
        const pagination = result.pagination as any;
        const formattedPagination = {
          totalItems: pagination.total || pagination.totalItems || 0,
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          totalPages: pagination.totalPages || 1,
        };
        paginatedResponse(res, result.data, formattedPagination);
      } else {
        successResponse(res, result);
      }
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/followups/{id}:
   *   put:
   *     tags: [FollowUps]
   *     summary: Actualizar un seguimiento
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
   *         description: Seguimiento actualizado
   */
  async updateFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { id } = req.params;
      const followUp = await FollowUpService.updateFollowUp(
        parseInt(id),
        req.body,
        userId
      );
      successResponse(res, followUp);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/followups/{id}:
   *   delete:
   *     tags: [FollowUps]
   *     summary: Eliminar un seguimiento
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       204:
   *         description: Seguimiento eliminado
   */
  async deleteFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { id } = req.params;
      await FollowUpService.deleteFollowUp(parseInt(id), userId);
      res.status(204).send();
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/followups/stats:
   *   get:
   *     tags: [FollowUps]
   *     summary: Obtener estadísticas de seguimientos del usuario
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas de seguimientos
   */
  async getFollowUpStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const stats = await FollowUpService.getFollowUpStats(userId);
      successResponse(res, stats);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/followups/directors/overview:
   *   get:
   *     tags: [FollowUps]
   *     summary: Vista general de seguimientos para directores
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Resumen general de seguimientos
   *       403:
   *         description: Acceso denegado (requiere rol de director)
   */
  async getDirectorsFollowUpOverview(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const overview = await FollowUpService.getDirectorsFollowUpOverview(
        userId
      );
      successResponse(res, overview);
    } catch (error: any) {
      errorResponse(res, error.message, 403);
    }
  }

  /**
   * @openapi
   * /v1/followups/{id}/complete:
   *   patch:
   *     tags: [FollowUps]
   *     summary: Completar un seguimiento planificado
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
   *         description: Seguimiento completado
   */
  async completeFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      const { id } = req.params;
      const followUp = await FollowUpService.completeFollowUp(
        parseInt(id),
        userId
      );
      successResponse(res, followUp);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/followups/planned:
   *   get:
   *     tags: [FollowUps]
   *     summary: Obtener seguimientos planificados (pendientes)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de seguimientos planificados
   */
  async getPlannedFollowUps(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      // El userId del query params es opcional para directores
      const targetUserId = req.query.userId
        ? parseInt(req.query.userId as string)
        : userId;

      const followUps = await FollowUpService.getPlanned(targetUserId);
      successResponse(res, followUps);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/followups/completed:
   *   get:
   *     tags: [FollowUps]
   *     summary: Obtener seguimientos completados
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: integer
   *         description: Filtrar por usuario (opcional, para directores)
   *     responses:
   *       200:
   *         description: Lista de seguimientos completados
   */
  async getCompletedFollowUps(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req, res);
      if (userId === null) return;

      // El userId del query params es opcional para directores
      const targetUserId = req.query.userId
        ? parseInt(req.query.userId as string)
        : userId;

      const followUps = await FollowUpService.getCompleted(targetUserId);
      successResponse(res, followUps);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }
}

import { Request, Response } from "express";
import { assignmentService } from "../services";
import {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentQueryParams,
  AssignmentParams,
} from "../types";
import { successResponse, errorResponse } from "@core/utils";

class AssignmentController {
  /**
   * @openapi
   * /v1/assignments:
   *   post:
   *     tags: [Assignments]
   *     summary: Crear una nueva asignación de edificio a un agente
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: integer
   *               buildingId:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Asignación creada
   */
  async createAssignment(req: Request, res: Response) {
    try {
      const companyId = req.companyId ?? null;
      const assignment = await assignmentService.createAssignment(
        req.bodyValidated,
        companyId
      );
      successResponse(res, assignment, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/assignments:
   *   get:
   *     tags: [Assignments]
   *     summary: Obtener lista de asignaciones
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de asignaciones
   */
  async getAssignments(req: Request, res: Response) {
    try {
      const companyId = req.companyId ?? null;
      const result = await assignmentService.getAssignments(req.queryValidated, companyId);
      successResponse(res, result, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }

  /**
   * @openapi
   * /v1/assignments/{id}:
   *   get:
   *     tags: [Assignments]
   *     summary: Obtener detalles de una asignación por ID
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
   *         description: Detalles de la asignación
   */
  async getAssignmentById(req: Request<AssignmentParams>, res: Response) {
    try {
      const id = parseInt(req.paramsValidated.id);
      const companyId = req.companyId ?? null;
      const assignment = await assignmentService.getAssignmentById(id, companyId);
      successResponse(res, assignment, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 404);
    }
  }

  /**
   * @openapi
   * /v1/assignments/{id}:
   *   put:
   *     tags: [Assignments]
   *     summary: Actualizar una asignación
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
   *         description: Asignación actualizada
   */
  async updateAssignment(
    req: Request<AssignmentParams, {}, UpdateAssignmentRequest>,
    res: Response
  ) {
    try {
      const id = parseInt(req.paramsValidated.id);
      const companyId = req.companyId ?? null;
      const assignment = await assignmentService.updateAssignment(
        id,
        req.bodyValidated,
        companyId
      );
      successResponse(res, assignment, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/assignments/{id}:
   *   delete:
   *     tags: [Assignments]
   *     summary: Eliminar una asignación
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
   *         description: Asignación eliminada
   */
  async deleteAssignment(req: Request<AssignmentParams>, res: Response) {
    try {
      const id = parseInt(req.paramsValidated.id);
      const companyId = req.companyId ?? null;
      await assignmentService.deleteAssignment(id, companyId);
      successResponse(res, null, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 404);
    }
  }

  /**
   * @openapi
   * /v1/assignments/user/{userId}:
   *   get:
   *     tags: [Assignments]
   *     summary: Obtener asignaciones de un usuario específico
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de asignaciones del usuario
   */
  async getAssignmentsByUser(req: Request<{ userId: string }>, res: Response) {
    try {
      const userId = parseInt(req.paramsValidated.userId);
      const companyId = req.companyId ?? null;
      const assignments = await assignmentService.getAssignmentsByUser(userId, companyId);
      successResponse(res, assignments, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }

  /**
   * @openapi
   * /v1/assignments/building/{buildingId}:
   *   get:
   *     tags: [Assignments]
   *     summary: Obtener asignaciones por edificio
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: buildingId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de asignaciones del edificio
   */
  async getAssignmentsByBuilding(
    req: Request<{ buildingId: string }, any, any, { activeOnly?: string }>,
    res: Response
  ) {
    try {
      const buildingId = parseInt(req.params.buildingId);
      if (isNaN(buildingId)) {
        errorResponse(res, "ID de edificio inválido", 400);
        return;
      }

      const companyId = req.companyId ?? null;
      // Verificar si se solicita solo asignaciones activas
      const activeOnly = req.query.activeOnly === "true";

      const assignments = await assignmentService.getAssignmentsByBuilding(
        buildingId,
        companyId,
        activeOnly
      );
      successResponse(res, assignments, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }

  async getAssignmentsSummary(req: Request, res: Response) {
    try {
      const companyId = req.companyId ?? null;
      const summary = await assignmentService.getAssignmentsSummary(companyId);
      successResponse(res, summary, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }
}

export const assignmentController = new AssignmentController();

import { Request, Response } from "express";
import { BoardService } from "../services/BoardService";
import { successResponse, errorResponse } from "@core/utils";

export class BoardController {
  private service: BoardService;

  constructor() {
    this.service = new BoardService();
  }

  /**
   * @openapi
   * /v1/boards:
   *   get:
   *     tags: [Boards]
   *     summary: Obtener todos los boards
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: ownerId
   *         schema:
   *           type: integer
   *       - in: query
   *         name: creatorId
   *         schema:
   *           type: integer
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lista de boards
   */
  async getBoards(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const roles = req.user?.roles?.map((r: any) => r.name) || [];
      const { ownerId, creatorId, search } = req.query as any;

      const boards = await this.service.getAllBoards(Number(userId), roles, {
        ownerId: ownerId ? Number(ownerId) : undefined,
        creatorId: creatorId ? Number(creatorId) : undefined,
        search: search as string,
      });
      successResponse(res, boards);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }

  /**
   * @openapi
   * /v1/boards/{id}:
   *   get:
   *     tags: [Boards]
   *     summary: Obtener un board por ID
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
   *         description: Board encontrado
   *       404:
   *         description: Board no encontrado
   */
  async getBoard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const board = await this.service.getBoardById(Number(id));
      if (!board) {
        errorResponse(res, "Board no encontrado", 404);
        return;
      }
      successResponse(res, board);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }

  /**
   * @openapi
   * /v1/boards:
   *   post:
   *     tags: [Boards]
   *     summary: Crear un nuevo board
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               ownerId:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Board creado
   */
  async createBoard(req: Request, res: Response) {
    try {
      const creatorId = req.user?.userId;
      const data = req.bodyValidated || req.body;
      const targetOwnerId = data.ownerId ? Number(data.ownerId) : Number(creatorId);

      const board = await this.service.createBoard({
        ...data,
        ownerId: targetOwnerId,
        creatorId: Number(creatorId),
      });
      successResponse(res, board, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/boards/{id}/columns:
   *   post:
   *     tags: [Boards]
   *     summary: Crear una nueva columna en un board
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
   *               name:
   *                 type: string
   *     responses:
   *       201:
   *         description: Columna creada
   */
  async createColumn(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.bodyValidated || req.body;
      const column = await this.service.createColumn({ ...data, boardId: Number(id) });
      successResponse(res, column, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/boards/columns/{id}:
   *   put:
   *     tags: [Boards]
   *     summary: Actualizar una columna
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
   *               name:
   *                 type: string
   *     responses:
   *       200:
   *         description: Columna actualizada
   */
  async updateColumn(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.bodyValidated || req.body;
      const column = await this.service.updateColumn(Number(id), data);
      successResponse(res, column);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/boards/columns/{id}:
   *   delete:
   *     tags: [Boards]
   *     summary: Eliminar una columna
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
   *         description: Columna eliminada
   */
  async deleteColumn(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.service.deleteColumn(Number(id));
      successResponse(res, { message: "Columna eliminada" });
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/boards/{id}/columns/reorder:
   *   put:
   *     tags: [Boards]
   *     summary: Reordenar columnas de un board
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
   *               columnIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *     responses:
   *       200:
   *         description: Columnas reordenadas
   */
  async reorderColumns(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { columnIds } = req.bodyValidated || req.body;
      await this.service.reorderColumns(Number(id), columnIds);
      successResponse(res, { message: "Columnas reordenadas" });
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/boards/cards:
   *   post:
   *     tags: [Boards]
   *     summary: Crear una nueva tarjeta
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               columnId:
   *                 type: integer
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Tarjeta creada
   */
  async createCard(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const data = req.bodyValidated || req.body;
      const card = await this.service.createCard({ ...data, creatorId: Number(userId) });
      successResponse(res, card, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/boards/cards/{id}:
   *   put:
   *     tags: [Boards]
   *     summary: Actualizar una tarjeta
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
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       200:
   *         description: Tarjeta actualizada
   */
  async updateCard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const data = req.bodyValidated || req.body;
      const card = await this.service.updateCard(Number(id), data, Number(userId));
      successResponse(res, card);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/boards/cards/{id}/move:
   *   put:
   *     tags: [Boards]
   *     summary: Mover una tarjeta a otra columna
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
   *               columnId:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Tarjeta movida
   */
  async moveCard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { columnId } = req.bodyValidated || req.body;
      const userId = req.user?.userId;
      const card = await this.service.moveCard(Number(id), columnId, Number(userId));
      successResponse(res, card);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/boards/cards/{id}:
   *   delete:
   *     tags: [Boards]
   *     summary: Eliminar una tarjeta
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
   *         description: Tarjeta eliminada
   */
  async deleteCard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      await this.service.deleteCard(Number(id), Number(userId));
      successResponse(res, { message: "Tarjeta eliminada" });
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/boards/activity:
   *   get:
   *     tags: [Boards]
   *     summary: Obtener actividad diaria de boards
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Actividad diaria
   */
  async getDailyActivity(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const activity = await this.service.getDailyActivity(Number(userId));
      successResponse(res, activity);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }
}

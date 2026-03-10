
import { Request, Response } from "express";
import { BoardService } from "../services/BoardService";

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
   *     summary: Obtener tableros (kanban) accesibles
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de tableros
   */
  async getBoards(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const roles = req.user?.roles?.map((r: any) => r.name) || [];
      const { ownerId, creatorId, search } = req.query;
      
      const boards = await this.service.getAllBoards(Number(userId), roles, {
        ownerId: ownerId ? Number(ownerId) : undefined,
        creatorId: creatorId ? Number(creatorId) : undefined,
        search: search as string
      });
      res.json(boards);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * @openapi
   * /v1/boards/{id}:
   *   get:
   *     tags: [Boards]
   *     summary: Obtener detalles de un tablero por ID
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
   *         description: Detalles del tablero
   */
  async getBoard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const board = await this.service.getBoardById(Number(id));
      if (!board) {
        res.status(404).json({ message: "Board not found" });
        return;
      }
      res.json(board);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * @openapi
   * /v1/boards:
   *   post:
   *     tags: [Boards]
   *     summary: Crear un nuevo tablero
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
   *     responses:
   *       200:
   *         description: Tablero creado
   */
  async createBoard(req: Request, res: Response) {
    try {
      const creatorId = req.user?.userId;
      const { ownerId, ...rest } = req.body;
      const targetOwnerId = ownerId ? Number(ownerId) : Number(creatorId);
      
      const board = await this.service.createBoard({ 
        ...rest, 
        ownerId: targetOwnerId, 
        creatorId: Number(creatorId) 
      });
      res.json(board);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * @openapi
   * /v1/boards/{id}/columns:
   *   post:
   *     tags: [Boards]
   *     summary: Crear una columna en un tablero
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
   *         description: Columna creada
   */
  async createColumn(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const column = await this.service.createColumn({ ...req.body, boardId: Number(id) });
      res.json(column);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  
  async createCard(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const card = await this.service.createCard({ ...req.body, creatorId: Number(userId) });
      res.json(card);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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
   *     responses:
   *       200:
   *         description: Tarjeta actualizada
   */
  async updateCard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const card = await this.service.updateCard(Number(id), req.body, Number(userId));
      res.json(card);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  
  /**
   * @openapi
   * /v1/boards/cards/{id}/move:
   *   patch:
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
      const { columnId } = req.body;
      const userId = req.user?.userId;
      const card = await this.service.moveCard(Number(id), columnId, Number(userId));
      res.json(card);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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
      res.json({ message: "Card deleted" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  
  async getDailyActivity(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const activity = await this.service.getDailyActivity(Number(userId));
      res.json(activity);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

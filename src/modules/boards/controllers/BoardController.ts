import { Request, Response } from "express";
import { BoardService } from "../services/BoardService";
import { successResponse, errorResponse } from "@core/utils";

export class BoardController {
  private service: BoardService;

  constructor() {
    this.service = new BoardService();
  }

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

  async deleteColumn(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.service.deleteColumn(Number(id));
      successResponse(res, { message: "Columna eliminada" });
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

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

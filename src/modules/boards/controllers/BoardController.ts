
import { Request, Response } from "express";
import { BoardService } from "../services/BoardService";

export class BoardController {
  private service: BoardService;

  constructor() {
    this.service = new BoardService();
  }

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

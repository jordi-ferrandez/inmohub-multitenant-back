import express from "express";
import { BoardController } from "../controllers";
import { bindAllMethods } from "@core/utils";
import { authenticationToken, tenantMiddleware } from "@core/middlewares";
import {
  validateCreateBoard,
  validateCreateColumn,
  validateUpdateColumn,
  validateReorderColumns,
  validateCreateCard,
  validateUpdateCard,
  validateMoveCard,
  validateIdParam,
} from "../validators";

const boardRouter = express.Router();
const boardController = bindAllMethods(new BoardController());

boardRouter.use(authenticationToken, tenantMiddleware);

boardRouter.get("/activity", boardController.getDailyActivity);
boardRouter.get("/", boardController.getBoards);
boardRouter.post("/", validateCreateBoard, boardController.createBoard);
boardRouter.get("/:id", validateIdParam, boardController.getBoard);
boardRouter.post("/:id/columns", validateIdParam, validateCreateColumn, boardController.createColumn);
boardRouter.put("/columns/:id", validateIdParam, validateUpdateColumn, boardController.updateColumn);
boardRouter.delete("/columns/:id", validateIdParam, boardController.deleteColumn);
boardRouter.put("/:id/columns/reorder", validateIdParam, validateReorderColumns, boardController.reorderColumns);
boardRouter.post("/cards", validateCreateCard, boardController.createCard);
boardRouter.put("/cards/:id/move", validateIdParam, validateMoveCard, boardController.moveCard);
boardRouter.put("/cards/:id", validateIdParam, validateUpdateCard, boardController.updateCard);
boardRouter.delete("/cards/:id", validateIdParam, boardController.deleteCard);

export default boardRouter;

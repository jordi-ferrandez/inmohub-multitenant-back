
import express from "express";
import { BoardController } from "../controllers";
import { bindAllMethods } from "@core/utils";
import { authenticationToken } from "@core/middlewares";

const boardRouter = express.Router();
const boardController = bindAllMethods(new BoardController());

boardRouter.use(authenticationToken);

boardRouter.get("/activity", boardController.getDailyActivity);
boardRouter.get("/", boardController.getBoards);
boardRouter.post("/", boardController.createBoard);
boardRouter.get("/:id", boardController.getBoard);
boardRouter.post("/:id/columns", boardController.createColumn);
boardRouter.put("/columns/:id", boardController.updateColumn);
boardRouter.delete("/columns/:id", boardController.deleteColumn);
boardRouter.put("/:id/columns/reorder", boardController.reorderColumns);
boardRouter.post("/cards", boardController.createCard);
boardRouter.put("/cards/:id/move", boardController.moveCard);
boardRouter.put("/cards/:id", boardController.updateCard);
boardRouter.delete("/cards/:id", boardController.deleteCard);

export default boardRouter;

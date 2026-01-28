
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
boardRouter.post("/cards", boardController.createCard);
boardRouter.put("/cards/:id/move", boardController.moveCard);
boardRouter.put("/cards/:id", boardController.updateCard);

export default boardRouter;

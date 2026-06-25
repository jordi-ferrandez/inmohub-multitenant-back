import express from "express";
import { forumController } from "./controller";
import { authenticationToken } from "@core/middlewares";
import {
  validateCreateTopic,
  validateCreatePost,
  validateModerateTopic,
  validateTopicIdParam,
  validatePostIdParam,
} from "./validators";

const forumRouter = express.Router();

forumRouter.get("/categories", authenticationToken, forumController.getCategories);
forumRouter.get("/topics", authenticationToken, forumController.getTopics);
forumRouter.get("/topics/:id", authenticationToken, validateTopicIdParam, forumController.getTopicById);

forumRouter.post("/categories", authenticationToken, forumController.createCategory);
forumRouter.post("/topics", authenticationToken, validateCreateTopic, forumController.createTopic);
forumRouter.post("/posts", authenticationToken, validateCreatePost, forumController.createPost);

forumRouter.patch("/topics/:id/moderate", authenticationToken, validateTopicIdParam, validateModerateTopic, forumController.moderateTopic);
forumRouter.delete("/posts/:id", authenticationToken, validatePostIdParam, forumController.deletePost);

export { forumRouter };

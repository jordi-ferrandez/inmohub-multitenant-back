import express from "express";
import { forumController } from "./controller";
import { authenticationToken, tenantMiddleware } from "@core/middlewares";
import {
  validateCreateTopic,
  validateCreatePost,
  validateModerateTopic,
  validateTopicIdParam,
  validatePostIdParam,
} from "./validators";

const forumRouter = express.Router();

forumRouter.get("/categories", authenticationToken, tenantMiddleware, forumController.getCategories);
forumRouter.get("/topics", authenticationToken, tenantMiddleware, forumController.getTopics);
forumRouter.get("/topics/:id", authenticationToken, tenantMiddleware, validateTopicIdParam, forumController.getTopicById);

forumRouter.post("/categories", authenticationToken, tenantMiddleware, forumController.createCategory);
forumRouter.post("/topics", authenticationToken, tenantMiddleware, validateCreateTopic, forumController.createTopic);
forumRouter.post("/posts", authenticationToken, tenantMiddleware, validateCreatePost, forumController.createPost);

forumRouter.patch("/topics/:id/moderate", authenticationToken, tenantMiddleware, validateTopicIdParam, validateModerateTopic, forumController.moderateTopic);
forumRouter.delete("/posts/:id", authenticationToken, tenantMiddleware, validatePostIdParam, forumController.deletePost);

export { forumRouter };

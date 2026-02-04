import express from "express";
import { forumController } from "./controller";
import { authenticationToken } from "@core/middlewares";

const forumRouter = express.Router();

// Public/Authenticated list routes
forumRouter.get("/categories", authenticationToken, forumController.getCategories);
forumRouter.get("/topics", authenticationToken, forumController.getTopics);
forumRouter.get("/topics/:id", authenticationToken, forumController.getTopicById);

// Create routes
forumRouter.post("/categories", authenticationToken, forumController.createCategory); // Should be admin
forumRouter.post("/topics", authenticationToken, forumController.createTopic);
forumRouter.post("/posts", authenticationToken, forumController.createPost);

// Moderation/Action routes
forumRouter.patch("/topics/:id/moderate", authenticationToken, forumController.moderateTopic);
forumRouter.delete("/posts/:id", authenticationToken, forumController.deletePost);

export { forumRouter };

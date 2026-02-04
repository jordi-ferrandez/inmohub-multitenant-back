import { Request, Response } from "express";
import { forumService } from "./service";
import { successResponse, errorResponse } from "@core/utils";

export const forumController = {
  // Categories
  getCategories: async (req: Request, res: Response) => {
    try {
      const categories = await forumService.getCategories();
      successResponse(res, categories);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  },

  createCategory: async (req: Request, res: Response) => {
    try {
      // Basic check for admin could be added here
      const category = await forumService.createCategory(req.body);
      successResponse(res, category, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  },

  // Topics
  getTopics: async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await forumService.getTopics(categoryId, page, limit);
      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  },

  getTopicById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const topic = await forumService.getTopicById(id);
      if (!topic) {
        errorResponse(res, "Tema no encontrado", 404);
        return;
      }
      successResponse(res, topic);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  },

  createTopic: async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.user?.userId as string);
      const topic = await forumService.createTopic({
        ...req.body,
        authorId: userId,
      });
      successResponse(res, topic, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  },

  // Posts
  createPost: async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.user?.userId as string);
      const post = await forumService.createPost({
        ...req.body,
        authorId: userId,
      });
      successResponse(res, post, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  },

  // Moderation (simplified)
  moderateTopic: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { action, value } = req.body; // action: 'lock', 'pin', 'delete'

      let result;
      switch (action) {
        case "lock":
          result = await forumService.lockTopic(id, value);
          break;
        case "pin":
          result = await forumService.pinTopic(id, value);
          break;
        case "delete":
          result = await forumService.deleteTopic(id);
          break;
        default:
          errorResponse(res, "Acción no válida", 400);
          return;
      }
      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  },

  deletePost: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await forumService.deletePost(id);
      successResponse(res, { message: "Post eliminado" });
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  },
};

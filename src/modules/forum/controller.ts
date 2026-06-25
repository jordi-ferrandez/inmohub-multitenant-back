import { Request, Response } from "express";
import { forumService } from "./service";
import { successResponse, errorResponse } from "@core/utils";

export const forumController = {
  getCategories: async (req: Request, res: Response) => {
    try {
      const categories = await forumService.getCategories();
      successResponse(res, categories);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  },

  createCategory: async (req: Request, res: Response) => {
    errorResponse(res, "Las categorías son gestionadas internamente", 400);
  },

  getTopics: async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await forumService.getTopics(category, page, limit);
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
      const data = req.bodyValidated || req.body;
      const topic = await forumService.createTopic({
        ...data,
        authorId: userId,
      });
      successResponse(res, topic, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  },

  createPost: async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.user?.userId as string);
      const data = req.bodyValidated || req.body;
      const post = await forumService.createPost({
        ...data,
        authorId: userId,
      });
      successResponse(res, post, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  },

  moderateTopic: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { action, value } = req.bodyValidated || req.body;

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

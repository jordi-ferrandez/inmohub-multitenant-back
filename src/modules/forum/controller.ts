import { Request, Response } from "express";
import { forumService } from "./service";
import { successResponse, errorResponse } from "@core/utils";

export const forumController = {
  /**
   * @openapi
   * /v1/forum/categories:
   *   get:
   *     tags: [Forum]
   *     summary: Obtener todas las categorías del foro
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de categorías
   */
  getCategories: async (req: Request, res: Response) => {
    try {
      const categories = await forumService.getCategories();
      successResponse(res, categories);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  },

  /**
   * @openapi
   * /v1/forum/categories:
   *   post:
   *     tags: [Forum]
   *     summary: Crear una categoría (gestionada internamente)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       400:
   *         description: Las categorías son gestionadas internamente
   */
  createCategory: async (req: Request, res: Response) => {
    errorResponse(res, "Las categorías son gestionadas internamente", 400);
  },

  /**
   * @openapi
   * /v1/forum/topics:
   *   get:
   *     tags: [Forum]
   *     summary: Obtener topics del foro
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista paginada de topics
   */
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

  /**
   * @openapi
   * /v1/forum/topics/{id}:
   *   get:
   *     tags: [Forum]
   *     summary: Obtener un topic por ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Topic encontrado
   *       404:
   *         description: Topic no encontrado
   */
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

  /**
   * @openapi
   * /v1/forum/topics:
   *   post:
   *     tags: [Forum]
   *     summary: Crear un nuevo topic
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               categoryId:
   *                 type: integer
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *     responses:
   *       201:
   *         description: Topic creado
   */
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

  /**
   * @openapi
   * /v1/forum/posts:
   *   post:
   *     tags: [Forum]
   *     summary: Crear un nuevo post en un topic
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               topicId:
   *                 type: integer
   *               content:
   *                 type: string
   *     responses:
   *       201:
   *         description: Post creado
   */
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

  /**
   * @openapi
   * /v1/forum/topics/{id}/moderate:
   *   patch:
   *     tags: [Forum]
   *     summary: Moderar un topic (lock, pin, delete)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               action:
   *                 type: string
   *                 enum: [lock, pin, delete]
   *               value:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Acción completada
   */
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

  /**
   * @openapi
   * /v1/forum/posts/{id}:
   *   delete:
   *     tags: [Forum]
   *     summary: Eliminar un post
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Post eliminado
   */
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

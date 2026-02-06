import { Request, Response } from "express";
import { forumService } from "./service";
import { successResponse, errorResponse } from "@core/utils";

export const forumController = {
  // Categories
  /**
   * @openapi
   * /v1/forum/categories:
   *   get:
   *     tags: [Forum]
   *     summary: Get all forum categories
   *     responses:
   *       200:
   *         description: List of categories
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
   *     summary: Create a new forum category
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Category created
   */
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
  /**
   * @openapi
   * /v1/forum/topics:
   *   get:
   *     tags: [Forum]
   *     summary: Get forum topics
   *     parameters:
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: integer
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
   *         description: List of topics
   */
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

  /**
   * @openapi
   * /v1/forum/topics/{id}:
   *   get:
   *     tags: [Forum]
   *     summary: Get a topic by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Topic details
   *       404:
   *         description: Topic not found
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
   *     summary: Create a new topic
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *               categoryId:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Topic created
   */
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
  /**
   * @openapi
   * /v1/forum/posts:
   *   post:
   *     tags: [Forum]
   *     summary: Create a new post in a topic
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
   *         description: Post created
   */
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
  /**
   * @openapi
   * /v1/forum/topics/{id}/moderate:
   *   post:
   *     tags: [Forum]
   *     summary: Moderate a topic (lock, pin, delete)
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
   *         description: Action performed
   */
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

  /**
   * @openapi
   * /v1/forum/posts/{id}:
   *   delete:
   *     tags: [Forum]
   *     summary: Delete a post
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
   *         description: Post deleted
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

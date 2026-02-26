import { Request, Response } from "express";
import { chatWithAi, extractTextFromImage } from "./service";
import { successResponse, errorResponse } from "@core/utils";

/**
 * @openapi
 * /v1/ai/chat:
 *   post:
 *     tags: [AI]
 *     summary: Chat with the AI assistant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [system, user, assistant]
 *                     content:
 *                       type: string
 *               context:
 *                 type: object
 *                 properties:
 *                   route:
 *                     type: string
 *                   screenTitle:
 *                     type: string
 *                   visibleData:
 *                     type: object
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
export const handleChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, context, mode } = req.body;

    if (!messages || !Array.isArray(messages)) {
      errorResponse(res, "Invalid messages format", 400);
      return;
    }

    const userId = req.user?.userId ? parseInt(req.user.userId, 10) : undefined;
    const userRole = req.user?.roles?.[0]?.name; // Primary role

    const augmentedContext = {
      ...(context || {}),
      userId,
      userRole,
    };

    const response = await chatWithAi(messages, augmentedContext, mode);
    successResponse(res, { message: response });
  } catch (error: any) {
    console.error("Chat Controller Error:", error);
    errorResponse(res, error.message || "Internal Server Error", 500);
  }
};

/**
 * @openapi
 * /v1/ai/ocr:
 *   post:
 *     tags: [AI]
 *     summary: Extract text from an uploaded image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Successfully extracted text
 */
export const handleOcr = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      errorResponse(res, "No file uploaded", 400);
      return;
    }

    const userIdStr = req.user?.userId;
    if (!userIdStr) {
      errorResponse(res, "User not authenticated", 401);
      return;
    }

    const result = await extractTextFromImage(req.file, parseInt(userIdStr, 10));
    successResponse(res, result);
  } catch (error: any) {
    console.error("OCR Controller Error:", error);
    errorResponse(res, error.message || "Internal Server Error", 500);
  }
};

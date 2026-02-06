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
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      errorResponse(res, "Invalid messages format", 400);
      return;
    }

    const response = await chatWithAi(messages, context || {});
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
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Text extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                 imageUrl:
 *                   type: string
 *       400:
 *         description: Image is required
 *       401:
 *         description: Unauthorized
 */
export const handleOcr = async (req: Request, res: Response): Promise<void> => {
  try {
    const userIdStr = req.user?.userId;
    if (!userIdStr) {
      errorResponse(res, "Usuario no autenticado", 401);
      return;
    }

    const userId = parseInt(userIdStr, 10);
    if (!req.file) {
      errorResponse(res, "Debe proporcionar una imagen", 400);
      return;
    }

    const result = await extractTextFromImage(req.file, userId);
    successResponse(res, result);
  } catch (error: any) {
    console.error("OCR Controller Error:", error);
    const status = error.message === "fondos insuficientes" ? 402 : 500;
    errorResponse(res, error.message || "Error al procesar la imagen", status);
  }
};

import { Request, Response } from "express";
import { chatWithAi, extractTextFromImage } from "./service";
import { successResponse, errorResponse } from "@core/utils";

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

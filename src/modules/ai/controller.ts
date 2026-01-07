import { Request, Response } from "express";
import { chatWithAi } from "./service";
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

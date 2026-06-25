import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { errorResponse } from "@core/utils";
import { FORUM_CATEGORIES } from "../service";

export const createTopicSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(200, "El título no puede exceder 200 caracteres"),
  content: z.string().min(1, "El contenido es obligatorio"),
  category: z.string().refine((val) => FORUM_CATEGORIES.includes(val), {
    message: `Categoría no válida. Opciones: ${FORUM_CATEGORIES.join(", ")}`,
  }),
  tags: z.array(z.string().min(1)).optional(),
});

export const createPostSchema = z.object({
  topicId: z.coerce.number().int().positive("ID de tema inválido"),
  content: z.string().min(1, "El contenido es obligatorio"),
});

export const moderateTopicSchema = z.object({
  action: z.enum(["lock", "pin", "delete"], { message: "Acción no válida. Opciones: lock, pin, delete" }),
  value: z.boolean(),
});

export const topicIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID de tema inválido"),
});

export const postIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID de post inválido"),
});

export const validateCreateTopic = (req: Request, res: Response, next: NextFunction): void => {
  const result = createTopicSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateCreatePost = (req: Request, res: Response, next: NextFunction): void => {
  const result = createPostSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateModerateTopic = (req: Request, res: Response, next: NextFunction): void => {
  const result = moderateTopicSchema.safeParse(req.body);
  if (!result.success) {
    errorResponse(res, result.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  req.bodyValidated = result.data;
  next();
};

export const validateTopicIdParam = (req: Request, res: Response, next: NextFunction): void => {
  const result = topicIdParamSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, "ID de tema inválido", 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

export const validatePostIdParam = (req: Request, res: Response, next: NextFunction): void => {
  const result = postIdParamSchema.safeParse(req.params);
  if (!result.success) {
    errorResponse(res, "ID de post inválido", 400);
    return;
  }
  req.paramsValidated = result.data;
  next();
};

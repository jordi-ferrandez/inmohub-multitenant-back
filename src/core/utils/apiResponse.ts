import { Response } from "express";
import {
  ErrorResponse,
  PaginatedResponse,
  PaginationMetadata,
  SuccessResponse,
} from "../types";

export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response<SuccessResponse<T>> => {
  const response: SuccessResponse<T> = {
    status: "success",
    data,
  };
  return res.status(statusCode).json(response);
};

export const paginatedResponse = <T>(
  res: Response,
  data: T,
  metadata: PaginationMetadata,
  statusCode: number = 200
): Response<PaginatedResponse<T>> => {
  const response: PaginatedResponse<T> = {
    status: "success",
    data,
    metadata,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  errorMessage: string,
  statusCode: number = 400,
  details?: any
): Response<ErrorResponse> => {
  const response: ErrorResponse = {
    status: "error",
    errorMessage,
    ...(details && { details }),
  };
  return res.status(statusCode).json(response);
};

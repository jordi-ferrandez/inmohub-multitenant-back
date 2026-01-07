export type ApiResponse<T = null> = {
  status: "success" | "error";
  data?: T;
  metadata?: PaginationMetadata;
  errorMessage?: string;
};

export type PaginationMetadata = {
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type SuccessResponse<T> = Omit<
  ApiResponse<T>,
  "errorMessage" | "status"
> & {
  status: "success";
};

export type ErrorResponse = Omit<
  ApiResponse,
  "data" | "status" | "metadata"
> & {
  status: "error";
  errorMessage: string;
};

export type PaginatedResponse<T> = SuccessResponse<T> & {
  metadata: PaginationMetadata;
};

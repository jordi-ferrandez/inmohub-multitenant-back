import { AssignmentDTO } from "./assignment-types";

export interface AssignmentResponse {
  status: string;
  data: AssignmentDTO;
}

export interface AssignmentListResponse {
  status: string;
  data: AssignmentDTO[];
  metadata: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

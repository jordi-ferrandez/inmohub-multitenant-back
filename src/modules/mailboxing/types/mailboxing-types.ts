export type MailboxingStatus = "inside" | "outside" | "no_disturb";
export type MailboxingExecutionStatus = "pending" | "completed" | "skipped" | "cancelled";

export interface MailboxingDTO {
  id: number;
  mailboxerId: number;
  mailboxer?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  buildingId: number;
  building?: {
    id: number;
    street: string;
    number: number;
    block?: string;
    stair?: string;
  };
  propertyIds?: number[];
  properties?: {
    id: number;
    number: string;
    floor: number;
  }[];
  status: MailboxingStatus;
  executionStatus: MailboxingExecutionStatus;
  comment?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  attachments?: MailboxingAttachmentDTO[];
}

export interface CreateMailboxingRequest {
  buildingId: number;
  propertyIds?: number[];
  status: MailboxingStatus;
  executionStatus?: MailboxingExecutionStatus;
  comment?: string;
  date: string; // ISO date string
  mailboxerId?: number;
}

export interface UpdateMailboxingRequest {
  status?: MailboxingStatus;
  executionStatus?: MailboxingExecutionStatus;
  comment?: string;
  date?: string; // ISO date string
}

export interface MailboxingQueryParams {
  page?: number;
  limit?: number;
  buildingId?: number;
  mailboxerId?: number;
  status?: MailboxingStatus;
  executionStatus?: MailboxingExecutionStatus;
  startDate?: string;
  endDate?: string;
}

export interface MailboxingListResponse {
  data: MailboxingDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MailboxingAttachmentDTO {
  id: number;
  mailboxingId: number;
  fileName?: string;
  mimeType?: string | null;
  fileSize?: number | null;
  s3Key: string;
  url: string;
  signedUrl: string;
  uploadedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMailboxingAttachmentRequest {
  // Placeholder para cuando se implemente AWS
  // El archivo se sube directamente y solo se envía metadata
}

export interface UpdateMailboxingAttachmentRequest {
  fileName?: string;
}

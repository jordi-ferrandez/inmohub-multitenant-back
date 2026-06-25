export interface CreateBoardRequest {
  title: string;
  description?: string;
  ownerId?: number;
  isPrivate?: boolean;
}

export interface CreateColumnRequest {
  title: string;
  order?: number;
}

export interface UpdateColumnRequest {
  title?: string;
  order?: number;
}

export interface ReorderColumnsRequest {
  columnIds: number[];
}

export interface CreateCardRequest {
  columnId: number;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  responsibleId?: number;
  dueDate?: string;
  tags?: string[];
}

export interface UpdateCardRequest {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  responsibleId?: number;
  dueDate?: string;
  tags?: string[];
}

export interface MoveCardRequest {
  columnId: number;
}

export interface BoardQueryParams {
  ownerId?: string;
  creatorId?: string;
  search?: string;
}

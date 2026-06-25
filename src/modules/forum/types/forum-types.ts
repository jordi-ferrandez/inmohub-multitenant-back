export interface CreateTopicRequest {
  title: string;
  content: string;
  category: string;
  tags?: string[];
}

export interface CreatePostRequest {
  topicId: number;
  content: string;
}

export interface ModerateTopicRequest {
  action: "lock" | "pin" | "delete";
  value: boolean;
}

export interface ForumTopicQueryParams {
  category?: string;
  page?: number;
  limit?: number;
}

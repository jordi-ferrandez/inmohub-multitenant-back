export type UserManagementDTO = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  roles: Array<{
    id: number;
    name: string;
    displayName: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  completedTours: string[];
};

export type UserListResponse = {
  users: UserManagementDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

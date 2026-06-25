export interface CreateCompanyRequest {
  name: string;
}

export interface CreateApiKeyRequest {
  companyId?: number;
  name: string;
  scopes?: string[];
  expiresAt?: string;
  restrictedIps?: string[];
}

export interface ApiKeyResponse {
  id: number;
  name: string;
  prefix: string;
  rawKey?: string;
  scopes: string[];
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

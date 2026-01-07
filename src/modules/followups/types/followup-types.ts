export enum ContactType {
  DIRECT = "Directo",
  PHONE = "Telefónico",
  LETTER_IN_HAND = "Carta en mano",
}

export enum LetterType {
  // Tipos de carta en mano (contactado)
  TENANT = "Inquilino",
  OWNER = "Propietario",
  CARETAKER = "Cuidador/tutor",
  // Tipos de carta debajo de la puerta (no contactado)
  LETTER_SOLD_BY_US = "Carta de piso vendido por nosotros",
  LETTER_EMPTY_PROPERTY = "Carta piso vacío",
  LETTER_INHERITANCE = "Carta herencia",
  LETTER_PROPERTY_FOR_SALE = "Carta piso en venta",
  LETTER_PROPERTY_LANDLORD = "Carta piso arrendador",
  LETTER_ADVISOR_PRESENTATION = "Carta presentación asesor zona",
}

export enum ObservationType {
  DOG = "Perro",
  NOISES = "Ruidos",
  PEEPHOLE = "Mirilla",
  LETTER_UNDER_DOOR = "Carta debajo puerta",
  // Nota: Los tipos específicos de cartas debajo de la puerta están en LetterType
  // y se seleccionan en un paso adicional cuando observationType es LETTER_UNDER_DOOR
}

export interface FollowUpDTO {
  id: number;
  sellerId: number;
  seller?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  propertyId: number;
  property?: {
    id: number;
    inmovillaCode: number;
    number: string;
    floor: number;
    building: {
      id: number;
      street: string;
      number: number;
      block?: string;
      stair?: string;
    };
  };

  // Nuevo sistema simplificado
  wasContacted: boolean;
  contactType?: ContactType;
  letterType?: LetterType;
  observationType?: ObservationType;

  plannedDate?: Date;
  executedDate?: Date;
  comment?: string;

  createdAt: Date;
  updatedAt: Date;
}

import { ReminderRecurrenceConfig } from "@modules/reminders/types";

export interface FollowUpReminderInput {
  create?: boolean;
  title?: string;
  note?: string;
  scheduledAt?: string;
  timezone?: string;
  recurrence?: ReminderRecurrenceConfig;
  responsibleId?: number;
}

export interface CreateFollowUpRequest {
  propertyId: number;
  wasContacted: boolean;
  contactType?: ContactType;
  letterType?: LetterType;
  observationType?: ObservationType;
  plannedDate?: string | Date;
  executedDate?: string | Date;
  comment?: string;
  reminder?: FollowUpReminderInput;
}

export interface UpdateFollowUpRequest {
  wasContacted?: boolean;
  contactType?: ContactType;
  letterType?: LetterType;
  observationType?: ObservationType;
  plannedDate?: string | Date;
  executedDate?: string | Date;
  comment?: string;
  reminder?: FollowUpReminderInput | null;
}

export interface FollowUpQueryParams {
  page?: number;
  limit?: number;
  sellerId?: number;
  propertyId?: number;
  wasContacted?: boolean;
  contactType?: ContactType;
  observationType?: ObservationType;
  plannedDateFrom?: string;
  plannedDateTo?: string;
  executedDateFrom?: string;
  executedDateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FollowUpListResponse {
  data: FollowUpDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FollowUpStatsDTO {
  totalFollowUps: number;
  followUpsThisMonth: number;
  followUpsContacted: number;
  followUpsNotContacted: number;
  followUpsByContactType: Array<{
    contactType: ContactType;
    count: number;
  }>;
  followUpsByObservationType: Array<{
    observationType: ObservationType;
    count: number;
  }>;
  followUpsPlanned: number;
  followUpsCompleted: number;
}

export interface AgentFollowUpStatsDTO {
  agent: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  totalFollowUps: number;
  followUpsThisMonth: number;
  followUpsContacted: number;
  followUpsNotContacted: number;
  followUpsByContactType: Array<{
    contactType: ContactType;
    count: number;
  }>;
  followUpsByObservationType: Array<{
    observationType: ObservationType;
    count: number;
  }>;
  followUpsPlanned: number;
  followUpsCompleted: number;
}

export interface DirectorsFollowUpOverviewDTO {
  totalAgents: number;
  totalFollowUps: number;
  followUpsThisMonth: number;
  agentsStats: AgentFollowUpStatsDTO[];
}

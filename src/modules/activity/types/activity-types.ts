export interface ActivityQueryParams {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  userId?: number; // Opcional: filtrar por usuario
}

export interface DailyContactActivity {
  date: string; // ISO date string (YYYY-MM-DD)
  
  // Contactado (totales y subcategorías)
  contacted: number; // Total contactados
  directContact: number; // Contacto Directo
  phoneContact: number; // Contacto Telefónico
  letterTenant: number; // Carta inquilino
  letterOwner: number; // Carta propietario
  letterCaregiver: number; // Carta cuidador/tutor
  
  // No Contactado (totales y subcategorías)
  notContacted: number; // Total no contactados
  dog: number; // Perro
  noises: number; // Ruidos
  peephole: number; // Mirilla
  letterSoldByUs: number; // Carta de piso vendido por nosotros
  letterEmptyProperty: number; // Carta piso vacío
  letterInheritance: number; // Carta herencia
  letterPropertyForSale: number; // Carta piso en venta
  letterPropertyLandlord: number; // Carta piso arrendador
  letterAdvisorPresentation: number; // Carta presentación asesor zona
  
  // Ocupado por (totales y subcategorías)
  occupiedBy: number; // Total ocupado por
  occupiedByTenant: number; // Inquilino
  occupiedByOwner: number; // Propietario
  occupiedByEmpty: number; // Vacio
  occupiedBySecondResidence: number; // Segunda residencia
  occupiedByNotIdentified: number; // No identificado
  
  // Información puerta (totales y subcategorías)
  doorInfo: number; // Total información puerta
  doorInfoPresident: number; // Presidente
  doorInfoInformer: number; // Informador
  doorInfoNoBell: number; // No timbre
  doorInfoNoCounter: number; // No contador
  doorInfoNoDoormat: number; // No felpudo
  doorInfoNoDisturb: number; // No interesa/No molestar
}

export interface DailyMailboxingActivity {
  date: string; // ISO date string (YYYY-MM-DD)
  inside: number; // Dentro
  outside: number; // Fuera
  noDisturb: number; // No molestar
}

export interface ActivityReportDTO {
  contactActivities: DailyContactActivity[];
  mailboxingActivities: DailyMailboxingActivity[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

// Tipos para items de actividad (seguimientos y buzoneamientos)
export interface ActivityItemsQueryParams {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  userId?: number; // Opcional: filtrar por usuario
  type?: "followup" | "mailboxing"; // Tipo de item
  category?: string; // Categoría específica (ej: "contacted", "notContacted", "inside", "outside")
  subcategory?: string; // Subcategoría específica (ej: "directContact", "dog", etc.)
  date?: string; // Fecha específica (YYYY-MM-DD)
  search?: string; // Búsqueda en comentarios
  page?: number;
  limit?: number;
  sortBy?: "date" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ActivityItemProperty {
  id: number;
  inmovillaCode: number;
  number: string;
  floor: number;
  buildingId: number;
}

export interface ActivityItemBuilding {
  id: number;
  street: string;
  number: string;
  block: string | null;
  stair: string | null;
}

export interface ActivityItemUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ActivityItemPerson {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
}

export interface FollowUpActivityItem {
  type: "followup";
  id: number;
  date: string; // Fecha de ejecución o creación
  wasContacted: boolean;
  contactType: string | null;
  letterType: string | null;
  observationType: string | null;
  comment: string | null;
  property: ActivityItemProperty;
  building: ActivityItemBuilding;
  user: ActivityItemUser;
  owner: ActivityItemPerson | null;
  tenant: ActivityItemPerson | null;
  category: string; // "contacted", "notContacted", "occupiedBy", "doorInfo"
  subcategory: string | null; // Subcategoría específica
}

export interface MailboxingActivityItem {
  type: "mailboxing";
  id: number;
  date: string;
  status: "inside" | "outside" | "no_disturb";
  comment: string | null;
  building: ActivityItemBuilding;
  user: ActivityItemUser;
  category: "mailboxing";
  subcategory: "inside" | "outside" | "noDisturb";
}

export type ActivityItem = FollowUpActivityItem | MailboxingActivityItem;

export interface ActivityItemsResponse {
  items: ActivityItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


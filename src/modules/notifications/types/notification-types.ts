export type NotificationChannel = "EMAIL" | "WHATSAPP" | "SMS";

export interface SendNotificationRequest {
  personId: number;
  channel: NotificationChannel;
  subject?: string;
  message: string;
}

export interface SendPropertyVisitRequest {
  followUpId: number;
}

export interface NotificationResult {
  channel: NotificationChannel;
  to: string;
  success: boolean;
  error?: string;
}

export interface BulkNotificationRequest {
  personIds: number[];
  channel: NotificationChannel;
  subject?: string;
  message: string;
}

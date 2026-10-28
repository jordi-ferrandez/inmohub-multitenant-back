import { UserQueryParams, UserParams } from '@modules/auth/types';
import { MailboxingQueryParams } from '@modules/mailboxing/types';
import {
  AgendaQueryParams as ReminderAgendaQueryParams,
  ReminderQueryParams,
  UpdateOccurrenceStatusRequest,
  UpdateReminderRequest,
  CreateReminderRequest,
} from '@modules/reminders/types';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      companyId?: number | null;
      isSuperAdmin?: boolean;
      queryValidated?:
        | UserQueryParams
        | MailboxingQueryParams
        | ReminderQueryParams
        | ReminderAgendaQueryParams
        | any;
      paramsValidated?: UserParams | any;
      bodyValidated?:
        | CreateReminderRequest
        | UpdateReminderRequest
        | UpdateOccurrenceStatusRequest
        | any;
      apiKey?: any;
    }
  }
}

export {};

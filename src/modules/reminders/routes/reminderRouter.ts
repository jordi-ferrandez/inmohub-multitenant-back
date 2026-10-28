import { Router } from "express";
import { reminderController } from "../controllers/ReminderController";
import {
  validateAgendaQuery,
  validateCreateReminder,
  validateOccurrenceParams,
  validateReminderParams,
  validateReminderQuery,
  validateReminderStatus,
  validateUpdateOccurrence,
  validateUpdateReminder,
} from "../validators";
import { authenticationToken, tenantMiddleware } from "@core/middlewares";

const router = Router();

router.use(authenticationToken, tenantMiddleware);

router.post(
  "/",
  validateCreateReminder,
  reminderController.createReminder.bind(reminderController)
);

router.get(
  "/",
  validateReminderQuery,
  reminderController.getReminders.bind(reminderController)
);

router.get(
  "/agenda",
  validateAgendaQuery,
  reminderController.getAgenda.bind(reminderController)
);

router.get(
  "/:id",
  validateReminderParams,
  reminderController.getReminder.bind(reminderController)
);

router.patch(
  "/:id",
  validateReminderParams,
  validateUpdateReminder,
  reminderController.updateReminder.bind(reminderController)
);

router.patch(
  "/:id/status",
  validateReminderParams,
  validateReminderStatus,
  reminderController.changeStatus.bind(reminderController)
);

router.delete(
  "/:id",
  validateReminderParams,
  reminderController.deleteReminder.bind(reminderController)
);

router.get(
  "/:id/occurrences",
  validateReminderParams,
  reminderController.getOccurrences.bind(reminderController)
);

router.patch(
  "/:reminderId/occurrences/:occurrenceId",
  validateOccurrenceParams,
  validateUpdateOccurrence,
  reminderController.updateOccurrence.bind(reminderController)
);

export const reminderRouter = router;


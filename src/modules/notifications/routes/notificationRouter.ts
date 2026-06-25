import { Router } from "express";
import { notificationController } from "../controllers/NotificationController";
import {
  validateSendNotification,
  validateBulkNotification,
  validatePropertyVisit,
  validatePreference,
} from "../validators";
import { authenticationToken } from "@core/middlewares";

const router = Router();

router.use(authenticationToken);

router.post(
  "/send",
  validateSendNotification,
  notificationController.sendNotification.bind(notificationController)
);

router.post(
  "/bulk",
  validateBulkNotification,
  notificationController.sendBulkNotification.bind(notificationController)
);

router.post(
  "/property-visit/:followUpId",
  validatePropertyVisit,
  notificationController.triggerPropertyVisitNotification.bind(notificationController)
);

router.get(
  "/preferences/:personId",
  notificationController.getPersonPreferences.bind(notificationController)
);

router.put(
  "/preferences/:personId",
  validatePreference,
  notificationController.updatePersonPreferences.bind(notificationController)
);

export const notificationRouter = router;

import { Router } from "express";
import { MailboxingController } from "../controllers";
import { authenticationToken, tenantMiddleware } from "@core/middlewares";
import {
  mailboxingQuerySchema,
  mailboxingParamsSchema,
  mailboxingAttachmentParamsSchema,
  mailboxingAttachmentCompositeParamsSchema,
  updateMailboxingAttachmentSchema,
  validateRequest,
  validateParams,
  validateQuery,
  validateCreateMailboxing,
  validateUpdateMailboxing,
} from "../validators";
import { bindAllMethods } from "@core/utils";
import { upload } from "@core/config/multer";

const router = Router();
const mailboxingController = bindAllMethods(new MailboxingController());

// Todas las rutas requieren autenticación + tenant
router.use(authenticationToken, tenantMiddleware);

// Obtener asignaciones activas del buzoneador
router.get("/assignments/active", mailboxingController.getActiveAssignments);

// Crear buzoneamiento
router.post(
  "/",
  validateCreateMailboxing,
  mailboxingController.createMailboxing
);

// Obtener lista de buzoneamientos
router.get(
  "/",
  validateQuery(mailboxingQuerySchema),
  mailboxingController.getMailboxings
);

// Estadísticas de buzoneamientos (solo para director)
// IMPORTANTE: Esta ruta debe ir ANTES de /:id para que "stats" no sea capturado como un ID
router.get(
  "/stats",
  mailboxingController.getMailboxingStats
);

// Obtener buzoneamiento por ID
router.get(
  "/:id",
  validateParams(mailboxingParamsSchema),
  mailboxingController.getMailboxingById
);

// Actualizar buzoneamiento
router.put(
  "/:id",
  validateUpdateMailboxing,
  validateParams(mailboxingParamsSchema),
  mailboxingController.updateMailboxing
);

// Eliminar buzoneamiento
router.delete(
  "/:id",
  validateParams(mailboxingParamsSchema),
  mailboxingController.deleteMailboxing
);

// Subir attachment para un buzoneamiento
router.post(
  "/:mailboxingId/attachments",
  validateParams(mailboxingAttachmentParamsSchema),
  upload.single("file"),
  mailboxingController.uploadAttachment
);

router.get(
  "/:mailboxingId/attachments",
  validateParams(mailboxingAttachmentParamsSchema),
  mailboxingController.listAttachments
);

router.patch(
  "/:mailboxingId/attachments/:attachmentId",
  validateParams(mailboxingAttachmentCompositeParamsSchema),
  validateRequest(updateMailboxingAttachmentSchema),
  mailboxingController.updateAttachment
);

// Eliminar attachment
router.delete(
  "/:mailboxingId/attachments/:attachmentId",
  validateParams(mailboxingAttachmentCompositeParamsSchema),
  mailboxingController.deleteAttachment
);

export default router;


import { authenticationToken, requireDirectorRole, tenantMiddleware } from "@core/middlewares";
import express from "express";
import {
  validateGetPropertyById,
  validatePatchPropertyById,
  validateGetPropertyAttachments,
  validateUploadPropertyAttachment,
  validateUpdatePropertyAttachment,
  validateDeletePropertyAttachment,
  validateGetPropertyFollowUps,
  validateGetProperties,

} from "../validators";
import { PropertyAttachmentController, PropertyController } from "../controller";
import { bindAllMethods } from "@core/utils";
import { upload } from "@core/config/multer";

const propertyRouter = express.Router();
const propertyController = bindAllMethods(new PropertyController());
const propertyAttachmentController = bindAllMethods(
  new PropertyAttachmentController()
);

// propertyRouter.get('/', (req, res) => {
//   res.send('Bienvenido a la página de inicio. -> ' + authenticationToken);
// });


propertyRouter.get(
  "/",
  authenticationToken,
  tenantMiddleware,
  validateGetProperties,
  propertyController.getProperty
);

propertyRouter.post(
  "/",
  authenticationToken,
  tenantMiddleware,
  propertyController.createProperty
);


propertyRouter.get(
  "/:id",
  authenticationToken,
  tenantMiddleware,
  validateGetPropertyById,
  propertyController.getPropertyById
);

propertyRouter.patch(
  "/:id",
  authenticationToken,
  tenantMiddleware,
  validatePatchPropertyById,
  propertyController.patchPropertyById
);

propertyRouter.delete(
  "/:id",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  propertyController.deleteProperty
);


propertyRouter.get(
  "/:id/follow-ups",
  authenticationToken,
  tenantMiddleware,
  validateGetPropertyFollowUps,
  propertyController.getPropertyFollowUps
);

propertyRouter.get(
  "/:id/attachments",
  authenticationToken,
  tenantMiddleware,
  validateGetPropertyAttachments,
  propertyAttachmentController.list
);

propertyRouter.post(
  "/:id/attachments",
  authenticationToken,
  tenantMiddleware,
  validateUploadPropertyAttachment,
  upload.single("file"),
  propertyAttachmentController.upload
);

propertyRouter.patch(
  "/:id/attachments/:attachmentId",
  authenticationToken,
  tenantMiddleware,
  validateUpdatePropertyAttachment,
  propertyAttachmentController.update
);

propertyRouter.delete(
  "/:id/attachments/:attachmentId",
  authenticationToken,
  tenantMiddleware,
  validateDeletePropertyAttachment,
  propertyAttachmentController.delete
);
export { propertyRouter };

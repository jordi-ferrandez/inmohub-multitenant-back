import { authenticationToken } from "@core/middlewares";
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
  validateGetProperties ,
  propertyController.getProperty
);


propertyRouter.get(
  "/:id",
  authenticationToken,
  validateGetPropertyById,
  propertyController.getPropertyById
);

propertyRouter.patch(
  "/:id",
  authenticationToken,
  validatePatchPropertyById,
  propertyController.patchPropertyById
);

propertyRouter.get(
  "/:id/follow-ups",
  authenticationToken,
  validateGetPropertyFollowUps,
  propertyController.getPropertyFollowUps
);

propertyRouter.get(
  "/:id/attachments",
  authenticationToken,
  validateGetPropertyAttachments,
  propertyAttachmentController.list
);

propertyRouter.post(
  "/:id/attachments",
  authenticationToken,
  validateUploadPropertyAttachment,
  upload.single("file"),
  propertyAttachmentController.upload
);

propertyRouter.patch(
  "/:id/attachments/:attachmentId",
  authenticationToken,
  validateUpdatePropertyAttachment,
  propertyAttachmentController.update
);

propertyRouter.delete(
  "/:id/attachments/:attachmentId",
  authenticationToken,
  validateDeletePropertyAttachment,
  propertyAttachmentController.delete
);
export { propertyRouter };

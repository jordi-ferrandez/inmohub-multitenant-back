import express from "express";
import { BuildingAttachmentController, BuildingController } from "../controllers";
import { bindAllMethods } from "@core/utils";
import { authenticationToken, requireDirectorRole, tenantMiddleware } from "@core/middlewares";
import {
  validateGetBuildingById,
  validateGetBuildings,
  validateGetBuildingsByStreetName,
  validateGetBuildingAttachments,
  validateUploadBuildingAttachment,
  validateUpdateBuildingAttachment,
  validateDeleteBuildingAttachment,
  validateGetBuildingMailboxings,
  validateDeleteBuilding,
} from "../validators";
import { upload } from "@core/config/multer";

const buildingRouter = express.Router();
const buildingController = bindAllMethods(new BuildingController());
const buildingAttachmentController = bindAllMethods(
  new BuildingAttachmentController()
);

buildingRouter.get(
  "/",
  authenticationToken,
  tenantMiddleware,
  validateGetBuildings,
  buildingController.getBuildings
);

buildingRouter.get(
  "/streets",
  authenticationToken,
  tenantMiddleware,
  buildingController.getBuildingsGroupedByStreets
);

buildingRouter.get(
  "/streets/:name",
  authenticationToken,
  tenantMiddleware,
  validateGetBuildingsByStreetName,
  buildingController.getBuildingsByStreetName
);

buildingRouter.post(
  "/",
  authenticationToken,
  tenantMiddleware,
  buildingController.createBuilding
);

buildingRouter.patch(
  "/:id",
  authenticationToken,
  tenantMiddleware,
  buildingController.updateBuilding
);


buildingRouter.get(
  "/:id",
  authenticationToken,
  tenantMiddleware,
  validateGetBuildingById,
  buildingController.getBuildingById
);

buildingRouter.get(
  "/:id/mailboxing",
  authenticationToken,
  tenantMiddleware,
  validateGetBuildingMailboxings,
  buildingController.getBuildingMailboxings
);

buildingRouter.get(
  "/:id/attachments",
  authenticationToken,
  tenantMiddleware,
  validateGetBuildingAttachments,
  buildingAttachmentController.list
);

buildingRouter.post(
  "/:id/attachments",
  authenticationToken,
  tenantMiddleware,
  validateUploadBuildingAttachment,
  upload.single("file"),
  buildingAttachmentController.upload
);

buildingRouter.patch(
  "/:id/attachments/:attachmentId",
  authenticationToken,
  tenantMiddleware,
  validateUpdateBuildingAttachment,
  buildingAttachmentController.update
);

buildingRouter.delete(
  "/:id/attachments/:attachmentId",
  authenticationToken,
  tenantMiddleware,
  validateDeleteBuildingAttachment,
  buildingAttachmentController.delete
);

buildingRouter.get(
  "/:id/deletion-summary",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  validateDeleteBuilding,
  buildingController.getDeletionSummary
);

buildingRouter.delete(
  "/:id",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  validateDeleteBuilding,
  buildingController.deleteBuilding
);

export { buildingRouter };

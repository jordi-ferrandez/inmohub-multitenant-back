import express from "express";
import { BuildingAttachmentController, BuildingController } from "../controllers";
import { bindAllMethods } from "@core/utils";
import { authenticationToken } from "@core/middlewares";
import {
  validateGetBuildingById,
  validateGetBuildings,
  validateGetBuildingsByStreetName,
  validateGetBuildingAttachments,
  validateUploadBuildingAttachment,
  validateUpdateBuildingAttachment,
  validateDeleteBuildingAttachment,
  validateGetBuildingMailboxings,
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
  validateGetBuildings,
  buildingController.getBuildings
);

buildingRouter.get(
  "/streets",
  authenticationToken,
  buildingController.getBuildingsGroupedByStreets
);

buildingRouter.get(
  "/streets/:name",
  authenticationToken,
  validateGetBuildingsByStreetName,
  buildingController.getBuildingsByStreetName
)

buildingRouter.get(
  "/:id",
  authenticationToken,
  validateGetBuildingById,
  buildingController.getBuildingById
);

buildingRouter.get(
  "/:id/mailboxing",
  authenticationToken,
  validateGetBuildingMailboxings,
  buildingController.getBuildingMailboxings
);

buildingRouter.get(
  "/:id/attachments",
  authenticationToken,
  validateGetBuildingAttachments,
  buildingAttachmentController.list
);

buildingRouter.post(
  "/:id/attachments",
  authenticationToken,
  validateUploadBuildingAttachment,
  upload.single("file"),
  buildingAttachmentController.upload
);

buildingRouter.patch(
  "/:id/attachments/:attachmentId",
  authenticationToken,
  validateUpdateBuildingAttachment,
  buildingAttachmentController.update
);

buildingRouter.delete(
  "/:id/attachments/:attachmentId",
  authenticationToken,
  validateDeleteBuildingAttachment,
  buildingAttachmentController.delete
);

export { buildingRouter };

import express from "express";
import { bindAllMethods } from "@core/utils";
import { authenticationToken } from "@core/middlewares";
import { WordPressController } from "../controllers/WordPressController";

const wordpressRouter = express.Router();
const wordpressController = bindAllMethods(new WordPressController());

import { upload } from "@core/config/multer";

wordpressRouter.post(
  "/import-json",
  authenticationToken,
  upload.single("jsonFile"),
  (req, res, next) => {
    wordpressController.importJson(req, res).catch(next);
  }
);

export { wordpressRouter };

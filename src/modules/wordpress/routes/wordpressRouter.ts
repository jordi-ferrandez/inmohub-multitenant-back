import express from "express";
import { bindAllMethods } from "@core/utils";
import { authenticationToken } from "@core/middlewares";
import { WordPressController } from "../controllers/WordPressController";
import { upload } from "@core/config/multer";
import { validateFileUpload } from "../validators";

const wordpressRouter = express.Router();
const wordpressController = bindAllMethods(new WordPressController());

wordpressRouter.post(
  "/import-json",
  authenticationToken,
  upload.single("jsonFile"),
  validateFileUpload,
  (req, res, next) => {
    wordpressController.importJson(req, res).catch(next);
  }
);

wordpressRouter.get("/test", (req, res, next) => {
  res.status(200).json({ status: "success", data: "test" });
});

wordpressRouter.get("/stats", authenticationToken, (req, res, next) => {
  wordpressController.stats(req, res).catch(next);
});

export { wordpressRouter };

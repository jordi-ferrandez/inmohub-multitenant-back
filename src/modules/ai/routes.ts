import express from "express";
import { handleChat, handleOcr } from "./controller";
import { authenticationToken } from "@core/middlewares";
import { upload } from "@core/config/multer";

const router = express.Router();

router.post("/chat", handleChat);
router.post("/ocr", authenticationToken, upload.single("image"), handleOcr);

export default router;

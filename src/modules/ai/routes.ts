import express from "express";
import { handleChat, handleOcr } from "./controller";
import { authenticationToken, tenantMiddleware } from "@core/middlewares";
import { upload } from "@core/config/multer";

const router = express.Router();

router.post("/chat", authenticationToken, tenantMiddleware, handleChat);
router.post("/ocr", authenticationToken, tenantMiddleware, upload.single("image"), handleOcr);

export default router;

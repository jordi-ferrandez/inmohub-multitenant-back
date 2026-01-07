import express from "express";
import { handleChat } from "./controller";

const router = express.Router();

router.post("/chat", handleChat);

export default router;

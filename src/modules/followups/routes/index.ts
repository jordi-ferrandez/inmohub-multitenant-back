import { Router } from "express";
import followUpRoutes from "./followupRoutes";
import agentRoutes from "./agentRoutes";

const followUpRouter = Router();

// Rutas principales de followups
followUpRouter.use("/", followUpRoutes);

// Rutas para agentes
followUpRouter.use("/agent", agentRoutes);

export { followUpRouter };

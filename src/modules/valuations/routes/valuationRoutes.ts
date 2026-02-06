import { Router } from "express";
import { ValuationController } from "../controllers/ValuationController";
import { bindAllMethods } from "@core/utils";
import { authenticationToken } from "@core/middlewares"; // Assuming middleware location

const router = Router();
const valuationController = bindAllMethods(new ValuationController());

// Public routes (for the widget iframe)
router.get("/widget/:slug", valuationController.getWidgetConfig);
router.post("/process", valuationController.processValuation);

// Secured Routes
router.post("/internal", authenticationToken, valuationController.createInternalValuation);

export default router;

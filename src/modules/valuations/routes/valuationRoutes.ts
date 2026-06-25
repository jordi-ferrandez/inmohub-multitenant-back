import { Router } from "express";
import { ValuationController } from "../controllers/ValuationController";
import { bindAllMethods } from "@core/utils";
import { authenticationToken } from "@core/middlewares";
import {
  validateSlugParam,
  validateProcessValuation,
  validateCreateInternalValuation,
} from "../validators";

const router = Router();
const valuationController = bindAllMethods(new ValuationController());

router.get("/widget/:slug", validateSlugParam, valuationController.getWidgetConfig);
router.post("/process", validateProcessValuation, valuationController.processValuation);
router.post("/internal", authenticationToken, validateCreateInternalValuation, valuationController.createInternalValuation);

export default router;

import { Router } from "express";
import { FlyerController } from "../controller/FlyerController";
import { authenticationToken, tenantMiddleware } from "@core/middlewares";
import {
  validateCreateFlyer,
  validateShipFlyer,
  validatePropertyIdParam,
  validateFlyerIdParam,
} from "../validators";

const router = Router();
const controller = new FlyerController();

router.get("/templates", authenticationToken, tenantMiddleware, (req, res) => controller.getTemplates(req, res));
router.get("/property/:propertyId", authenticationToken, tenantMiddleware, validatePropertyIdParam, (req, res) => controller.getPropertyFlyers(req, res));
router.post("/", authenticationToken, tenantMiddleware, validateCreateFlyer, (req, res) => controller.createFlyer(req, res));
router.post("/:id/ship", authenticationToken, tenantMiddleware, validateFlyerIdParam, validateShipFlyer, (req, res) => controller.shipFlyer(req, res));
router.get("/:id/shipments", authenticationToken, tenantMiddleware, validateFlyerIdParam, (req, res) => controller.getFlyerShipments(req, res));

export { router as flyerRouter };

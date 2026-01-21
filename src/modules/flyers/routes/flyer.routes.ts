import { Router } from "express";
import { FlyerController } from "../controller/FlyerController";
import { authenticationToken } from "@core/middlewares";

const router = Router();
const controller = new FlyerController();

router.get("/templates", authenticationToken, (req, res) => controller.getTemplates(req, res));
router.get("/property/:propertyId", authenticationToken, (req, res) => controller.getPropertyFlyers(req, res));
router.post("/", authenticationToken, (req, res) => controller.createFlyer(req, res));
router.post("/:id/ship", authenticationToken, (req, res) => controller.shipFlyer(req, res));
router.get("/:id/shipments", authenticationToken, (req, res) => controller.getFlyerShipments(req, res));

export { router as flyerRouter };

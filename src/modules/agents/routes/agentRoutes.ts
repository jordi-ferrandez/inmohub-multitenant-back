import { Router } from "express";
import { AgentController } from "../controllers/AgentController";
import { requireAgentRole } from "../../followups/middlewares";
import { authenticationToken } from "@core/middlewares";
import { bindAllMethods } from "@core/utils";
import {
  validateAvailablePropertiesQuery,
  validatePropertyIdParam,
} from "../validators";

const router = Router();
const agentController = bindAllMethods(new AgentController());

router.use(authenticationToken);

router.get(
  "/properties/available",
  validateAvailablePropertiesQuery,
  agentController.getAvailableProperties
);

router.use(requireAgentRole);

router.get("/assignments/active", agentController.getActiveAssignments);
router.get("/assignments/history", agentController.getAssignmentsHistory);

router.get(
  "/properties/:propertyId/followups",
  validatePropertyIdParam,
  agentController.getPropertyFollowUpsHistory
);

export default router;

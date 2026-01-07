import express, { Express } from "express";
import { authRouter } from "../../modules/auth/routes";
import { testRouter } from "./testRouter";
import { inmovillaRouter } from "../../modules/inmovilla/routes";
import { buildingRouter } from "@modules/buildings/routes";
import { propertyRouter } from "@modules/properties/routes";
import { personRouter } from "@modules/persons/routes";
import { assignmentRouter } from "@modules/assignments/routes";
import { followUpRouter } from "@modules/followups";
import agentRoutes from "@modules/agents/routes/agentRoutes";
import mailboxingRouter from "@modules/mailboxing/routes";
import { reminderRouter } from "@modules/reminders";
import activityRouter from "@modules/activity/routes";
import aiRouter from "@modules/ai/routes";

function routerAPI(app: Express) {
  const router = express.Router();
  app.use("/api/v1", router);
  router.use("/auth", authRouter);
  router.use("/inmovilla", inmovillaRouter);
  router.use("/buildings", buildingRouter);
  router.use("/properties", propertyRouter);
  router.use("/persons", personRouter);
  router.use("/assignments", assignmentRouter);
  router.use("/followups", followUpRouter);
  router.use("/agents", agentRoutes);
  router.use("/mailboxing", mailboxingRouter);
  router.use("/reminders", reminderRouter);
  router.use("/activity", activityRouter);
  router.use("/ai", aiRouter);
  router.use("/", testRouter);
}
export { routerAPI };

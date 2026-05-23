import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import agentRouter from "./agent";
import agentChatRouter from "./agent-chat";
import journeyAnalyzeRouter from "./journey-analyze";
import fileExtractRouter from "./file-extract";
import wikiRouter from "./wiki";
import auditRouter from "./audit";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(agentRouter);
router.use(agentChatRouter);
router.use(journeyAnalyzeRouter);
router.use(fileExtractRouter);
router.use(wikiRouter);
router.use(auditRouter);

export default router;

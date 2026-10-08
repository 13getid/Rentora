import { Router } from "express";
import { authenticate, getCtx, requireOrg, requireRole } from "../middleware/auth";

// TEMPORARY: these routes exist only to demonstrate the guards. Delete this file in Phase 4.
export const guardDemoRouter = Router();

// Router-level middleware: everything below runs authenticate, then requireOrg.
guardDemoRouter.use(authenticate, requireOrg);

guardDemoRouter.get("/context", (req, res) => {
  res.json(getCtx(req));
});

guardDemoRouter.get("/owner-only", requireRole("OWNER"), (req, res) => {
  res.json({ message: "You are an OWNER here.", organizationId: getCtx(req).organizationId });
});
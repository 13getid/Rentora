import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withOrg } from "../lib/tenantDb";
import { authenticate, getCtx, requireOrg, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

// TEMPORARY: demonstrates the guards and RLS. Delete this file in Phase 4.
export const guardDemoRouter = Router();

guardDemoRouter.use(authenticate, requireOrg);

guardDemoRouter.get("/context", (req, res) => {
  res.json(getCtx(req));
});

guardDemoRouter.get("/owner-only", requireRole("OWNER"), (req, res) => {
  res.json({ message: "You are an OWNER here.", organizationId: getCtx(req).organizationId });
});

const createPropertySchema = z.object({ name: z.string().trim().min(2).max(100) }).strict();

// The organization comes from the server (getCtx), never from the request body.
guardDemoRouter.post("/properties", requireRole("OWNER", "MANAGER"), validateBody(createPropertySchema), async (req, res) => {
  const { organizationId } = getCtx(req);
  const property = await withOrg(organizationId, (tx) =>
    tx.property.create({ data: { organizationId, name: req.body.name }, select: { id: true, name: true } }),
  );
  res.status(201).json(property);
});

// Look closely: there is NO `where: { organizationId }` here. This is the "forgotten filter" bug.
// RLS makes it harmless: the database only returns this organization's rows.
guardDemoRouter.get("/properties", async (req, res) => {
  const { organizationId } = getCtx(req);
  res.json(await withOrg(organizationId, (tx) => tx.property.findMany({ select: { id: true, name: true } })));
});

// The OTHER bug: forgetting withOrg() entirely. The database fails closed and returns nothing.
guardDemoRouter.get("/properties-no-context", async (_req, res) => {
  res.json(await prisma.property.findMany({ select: { id: true, name: true } }));
});
import { Router } from "express";
import { z } from "zod";
import { propertyScope } from "../lib/access";
import { prisma } from "../lib/prisma";
import { withOrg } from "../lib/tenantDb";
import { authenticate, getCtx, requireOrg, requireRole } from "../middleware/auth";
import { requirePropertyAccess } from "../middleware/access";
import { validateBody } from "../middleware/validate";

// TEMPORARY: demonstrates the guards, RLS and grants. Delete this file in Phase 4.
export const guardDemoRouter = Router();

guardDemoRouter.use(authenticate, requireOrg);

guardDemoRouter.get("/context", (req, res) => {
  res.json(getCtx(req));
});

guardDemoRouter.get("/owner-only", requireRole("OWNER"), (req, res) => {
  res.json({ message: "You are an OWNER here.", organizationId: getCtx(req).organizationId });
});

const createPropertySchema = z.object({ name: z.string().trim().min(2).max(100) }).strict();

// Owners add properties. Managers work on properties they were granted.
guardDemoRouter.post("/properties", requireRole("OWNER"), validateBody(createPropertySchema), async (req, res) => {
  const { organizationId } = getCtx(req);
  const property = await withOrg(organizationId, (tx) =>
    tx.property.create({ data: { organizationId, name: req.body.name }, select: { id: true, name: true } }),
  );
  res.status(201).json(property);
});

// Organization boundary: RLS. Boundary inside the organization: propertyScope (role + grants).
guardDemoRouter.get("/properties", async (req, res) => {
  const ctx = getCtx(req);
  res.json(
    await withOrg(ctx.organizationId, (tx) =>
      tx.property.findMany({ where: propertyScope(ctx), select: { id: true, name: true } }),
    ),
  );
});

// requirePropertyAccess answers 404 unless this person may touch this property.
guardDemoRouter.get("/properties/:propertyId", requirePropertyAccess, async (req, res) => {
  const ctx = getCtx(req);
  const id = req.params.propertyId as string;
  res.json(await withOrg(ctx.organizationId, (tx) => tx.property.findUniqueOrThrow({ where: { id }, select: { id: true, name: true } })));
});

// Forgot withOrg(): the database fails closed.
guardDemoRouter.get("/properties-no-context", async (_req, res) => {
  res.json(await prisma.property.findMany({ select: { id: true, name: true } }));
});
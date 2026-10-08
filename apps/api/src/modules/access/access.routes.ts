import { Router } from "express";
import { z } from "zod";
import { uuidParam } from "../../lib/params";
import { authenticate, getAuth, getCtx, requireOrg, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { createGrant, listGrants, listMembers, revokeGrant } from "./access.service";

export const accessRouter = Router();

// Applied PER ROUTE, not with router.use(). This router is mounted at /api/v1, so a router-level
// guard would also demand a login on unknown URLs and turn every 404 into a 401.
const ownerOnly = [authenticate, requireOrg, requireRole("OWNER")];

const grantSchema = z
  .object({
    membershipId: z.string().uuid(),
    expiresAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), "Choose a date in the future.").optional(),
  })
  .strict();

accessRouter.get("/members", ...ownerOnly, async (req, res) => {
  res.json(await listMembers(getCtx(req)));
});

accessRouter.post("/properties/:propertyId/grants", ...ownerOnly, validateBody(grantSchema), async (req, res) => {
  const grant = await createGrant(getCtx(req), getAuth(req).userId, uuidParam(req.params.propertyId), req.body, req.ip);
  res.status(201).json(grant);
});

accessRouter.get("/properties/:propertyId/grants", ...ownerOnly, async (req, res) => {
  res.json(await listGrants(getCtx(req), uuidParam(req.params.propertyId)));
});

accessRouter.delete("/grants/:grantId", ...ownerOnly, async (req, res) => {
  await revokeGrant(getCtx(req), getAuth(req).userId, uuidParam(req.params.grantId), req.ip);
  res.status(204).end();
});
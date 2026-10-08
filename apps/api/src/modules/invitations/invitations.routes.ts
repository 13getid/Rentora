import { Router } from "express";
import { uuidParam } from "../../lib/params";
import { authenticate, getAuth, getCtx, requireOrg, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { inviteSchema } from "./invitations.schemas";
import { createInvitation, listInvitations, revokeInvitation } from "./invitations.service";

export const invitationsRouter = Router();

// Safe to use router-level middleware here: this router is mounted on its OWN prefix.
invitationsRouter.use(authenticate, requireOrg, requireRole("OWNER"));

invitationsRouter.post("/", validateBody(inviteSchema), async (req, res) => {
  res.status(201).json(await createInvitation(getCtx(req), getAuth(req).userId, req.body, req.ip));
});

invitationsRouter.get("/", async (req, res) => {
  res.json(await listInvitations(getCtx(req)));
});

invitationsRouter.delete("/:id", async (req, res) => {
  await revokeInvitation(getCtx(req), getAuth(req).userId, uuidParam(req.params.id), req.ip);
  res.status(204).end();
});
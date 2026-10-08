import { Router } from "express";
import { authenticate, getAuth } from "../../middleware/auth";
import { authLimiter } from "../../middleware/rateLimit";
import { validateBody } from "../../middleware/validate";
import { acceptExistingSchema, acceptNewSchema } from "./invitations.schemas";
import { acceptAsExistingUser, acceptAsNewUser } from "./invitations.service";

export const acceptRouter = Router();

const meta = (req: { ip?: string; get(name: string): string | undefined }) => ({
  ip: req.ip,
  userAgent: req.get("user-agent"),
});

// Public: the token in the body IS the credential.
acceptRouter.post("/accept", authLimiter, validateBody(acceptNewSchema), async (req, res) => {
  res.status(201).json(await acceptAsNewUser(req.body, meta(req)));
});

// For someone who already has an account: they must be logged in as the invited email.
acceptRouter.post("/accept-existing", authLimiter, authenticate, validateBody(acceptExistingSchema), async (req, res) => {
  res.json(await acceptAsExistingUser(getAuth(req).userId, req.body.token, meta(req)));
});
import { Router } from "express";
import { authLimiter } from "../../middleware/rateLimit";
import { validateBody } from "../../middleware/validate";
import { signupSchema } from "./auth.schemas";
import { signup } from "./auth.service";

export const authRouter = Router();

// Middleware runs left to right: rate limit → validate → handler.
authRouter.post("/signup", authLimiter, validateBody(signupSchema), async (req, res) => {
  const result = await signup(req.body, { ip: req.ip, userAgent: req.get("user-agent") });
  res.status(201).json(result);
});
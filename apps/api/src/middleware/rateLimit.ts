import { rateLimit } from "express-rate-limit";

// At most 20 requests per 15 minutes from one IP on auth routes.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      code: "RATE_LIMITED",
      message: "Too many attempts. Wait a few minutes and try again.",
    });
  },
});
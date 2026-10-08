import { Router, type Request, type Response } from "express";
import { env } from "../../config/env";
import { authLimiter } from "../../middleware/rateLimit";
import { validateBody } from "../../middleware/validate";
import { loginSchema, signupSchema } from "./auth.schemas";
import { login, logout, refresh, signup } from "./auth.service";

export const authRouter = Router();

const COOKIE = "rentora_refresh";

const cookieOptions = {
  httpOnly: true, // JavaScript cannot read it, which defeats token theft via XSS
  sameSite: "lax" as const, // not sent on cross-site POSTs, which blocks CSRF
  secure: env.NODE_ENV === "production", // HTTPS only in production
  path: "/api/v1/auth", // the browser sends it to auth routes and nowhere else
};

const setRefreshCookie = (res: Response, token: string) =>
  res.cookie(COOKIE, token, { ...cookieOptions, maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000 });

const meta = (req: Request) => ({ ip: req.ip, userAgent: req.get("user-agent") });

authRouter.post("/signup", authLimiter, validateBody(signupSchema), async (req, res) => {
  res.status(201).json(await signup(req.body, meta(req)));
});

authRouter.post("/login", authLimiter, validateBody(loginSchema), async (req, res) => {
  const { refreshToken, ...body } = await login(req.body, meta(req));
  setRefreshCookie(res, refreshToken); // the refresh token goes in the cookie...
  res.json(body); // ...and is NOT in the JSON the page's JavaScript receives
});

authRouter.post("/refresh", authLimiter, async (req, res) => {
  const { accessToken, refreshToken } = await refresh(req.cookies?.[COOKIE], meta(req));
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken });
});

authRouter.post("/logout", async (req, res) => {
  await logout(req.cookies?.[COOKIE]);
  res.clearCookie(COOKIE, cookieOptions); // path must match, or the browser keeps the cookie
  res.status(204).end();
});
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { healthRouter } from "./routes/health";
import cookieParser from "cookie-parser";

export function createApp() {
  const app = express();

  app.use(helmet()); // security headers
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true })); // only our web app may call us
  // NOTE (Phase 7): the Stripe webhook route must be mounted BEFORE this line,
  // because it needs the raw, unparsed body to verify Stripe's signature.
  app.use(express.json({ limit: "100kb" })); // read JSON bodies, reject huge ones
  app.use(cookieParser()); // read cookies into req.cookies

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);

  app.use(notFound); // after all routes
  app.use(errorHandler); // always last

  return app;
}
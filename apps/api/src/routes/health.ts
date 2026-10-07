import { Router } from "express";

export const healthRouter = Router();

// GET /api/v1/health: "is the server alive?"
healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", service: "rentora-api", time: new Date().toISOString() });
});
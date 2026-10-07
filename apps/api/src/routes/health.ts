import { Router } from "express";
import { prisma } from "../lib/prisma";

export const healthRouter = Router();

// "Is the server alive?"
healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", service: "rentora-api", time: new Date().toISOString() });
});

// "Can the server reach the database?"
healthRouter.get("/db", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "connected" });
});
import type { RequestHandler } from "express";
import { propertyScope } from "../lib/access";
import { uuidParam } from "../lib/params";
import { withOrg } from "../lib/tenantDb";
import { getCtx } from "./auth";
import { AppError } from "./errorHandler";

// The third checkpoint from Phase 1: "may THIS user touch THIS record?"
// Use on any route containing :propertyId.
export const requirePropertyAccess: RequestHandler = async (req, _res, next) => {
  const ctx = getCtx(req);
  const propertyId = uuidParam(req.params.propertyId);

  const found = await withOrg(ctx.organizationId, (tx) =>
    tx.property.findFirst({ where: { id: propertyId, ...propertyScope(ctx) }, select: { id: true } }),
  );

  // 404 for "doesn't exist", "other organization" AND "no grant": all look identical.
  if (!found) throw new AppError(404, "NOT_FOUND", "We couldn't find that property.");
  next();
};
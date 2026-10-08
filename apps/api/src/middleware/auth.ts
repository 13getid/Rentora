import type { Request, RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import type { Role } from "../lib/roles";
import { verifyAccessToken } from "../lib/tokens";
import { AppError } from "./errorHandler";
import { withSystem } from "../lib/tenantDb";

const unauthenticated = () => new AppError(401, "UNAUTHENTICATED", "Please log in to continue.");

// ------------------------------------------------ 1. WHO are you?
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) throw unauthenticated();

  // Signature, algorithm and expiry are checked inside verifyAccessToken.
  const claims = await verifyAccessToken(token);
  if (!claims) throw unauthenticated();

  // A valid signature is not enough: the login session must still be alive.
  const session = await prisma.session.findFirst({
    where: { id: claims.sessionId, userId: claims.userId, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { user: { select: { id: true, isSystemAdmin: true } } },
  });
  if (!session) throw unauthenticated();

  req.auth = { userId: session.user.id, sessionId: claims.sessionId, isSystemAdmin: session.user.isSystemAdmin };
  next();
};

// ------------------------------------------------ 2. WHICH organization?
const uuid = z.string().uuid();

export const requireOrg: RequestHandler = async (req, _res, next) => {
  const { userId } = getAuth(req);
  const requested = req.get("x-organization-id");

  if (requested !== undefined && !uuid.safeParse(requested).success) {
    throw new AppError(400, "INVALID_ORGANIZATION_ID", "The organization ID is not valid.");
  }

  // The DATABASE decides which memberships exist. The header only narrows the search.
const memberships = await withSystem((tx) =>
  tx.membership.findMany({
    where: {
      userId,
      status: "ACTIVE",
      organization: { status: "ACTIVE" },
      ...(requested ? { organizationId: requested } : {}),
    },
    select: { id: true, organizationId: true, role: true },
  }),
);

  if (memberships.length === 0) {
    // Same answer for "not a member" and "no such organization".
    throw new AppError(403, "FORBIDDEN", "You don't have access to that organization.");
  }
  if (memberships.length > 1) {
    throw new AppError(
      400,
      "ORGANIZATION_REQUIRED",
      "You belong to more than one organization. Choose one with the X-Organization-Id header.",
    );
  }

  const [m] = memberships;
  req.ctx = { organizationId: m.organizationId, membershipId: m.id, role: m.role };
  next();
};

// ------------------------------------------------ 3. WHAT may you do?
export const requireRole =
  (...allowed: Role[]): RequestHandler =>
  (req, _res, next) => {
    const { role } = getCtx(req);
    if (!allowed.includes(role)) {
      throw new AppError(403, "FORBIDDEN", "Your role doesn't allow this action.");
    }
    next();
  };

// Platform-level admin (not tied to any organization).
export const requireSystemAdmin: RequestHandler = (req, _res, next) => {
  if (!getAuth(req).isSystemAdmin) throw new AppError(403, "FORBIDDEN", "This area is for platform administrators.");
  next();
};

// ------------------------------------------------ helpers (fail closed)
// Handlers use these instead of req.auth!, so a missing middleware becomes a loud 500, never open access.
export function getAuth(req: Request) {
  if (!req.auth) throw new Error("authenticate must run before this middleware or handler");
  return req.auth;
}

export function getCtx(req: Request) {
  if (!req.ctx) throw new Error("requireOrg must run before this middleware or handler");
  return req.ctx;
}
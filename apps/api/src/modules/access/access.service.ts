import type { Ctx } from "../../lib/access";
import { withOrg } from "../../lib/tenantDb";
import { AppError } from "../../middleware/errorHandler";

const propertyNotFound = () => new AppError(404, "NOT_FOUND", "We couldn't find that property.");

export const listMembers = (ctx: Ctx) =>
  withOrg(ctx.organizationId, async (tx) => {
    const rows = await tx.membership.findMany({
      where: { organizationId: ctx.organizationId },
      select: { id: true, role: true, status: true, user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((m) => ({ membershipId: m.id, role: m.role, status: m.status, ...m.user }));
  });

export async function createGrant(
  ctx: Ctx,
  actorUserId: string,
  propertyId: string,
  input: { membershipId: string; expiresAt?: Date },
  ip?: string,
) {
  return withOrg(ctx.organizationId, async (tx) => {
    const property = await tx.property.findFirst({ where: { id: propertyId, organizationId: ctx.organizationId } });
    if (!property) throw propertyNotFound();

    const membership = await tx.membership.findFirst({
      where: { id: input.membershipId, organizationId: ctx.organizationId, status: "ACTIVE" },
    });
    if (!membership) throw new AppError(404, "NOT_FOUND", "We couldn't find that team member.");
    if (membership.role !== "MANAGER") {
      throw new AppError(
        422,
        "NOT_A_MANAGER",
        "Only managers receive property grants. Owners already have full access, and tenants and staff are limited by their lease or tasks.",
      );
    }

    // Granting again replaces the earlier grant, which is also how you change an expiry date.
    await tx.propertyAccessGrant.updateMany({
      where: { organizationId: ctx.organizationId, membershipId: membership.id, propertyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const grant = await tx.propertyAccessGrant.create({
      data: {
        organizationId: ctx.organizationId,
        membershipId: membership.id,
        propertyId,
        grantedById: actorUserId,
        expiresAt: input.expiresAt,
      },
      select: { id: true, propertyId: true, membershipId: true, expiresAt: true, createdAt: true },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organizationId,
        actorUserId,
        action: "grant.created",
        entity: "PropertyAccessGrant",
        entityId: grant.id,
        metadata: { propertyId, membershipId: membership.id, expiresAt: input.expiresAt?.toISOString() ?? null },
        ip,
      },
    });
    return grant;
  });
}

export const listGrants = (ctx: Ctx, propertyId: string) =>
  withOrg(ctx.organizationId, async (tx) => {
    const property = await tx.property.findFirst({ where: { id: propertyId, organizationId: ctx.organizationId } });
    if (!property) throw propertyNotFound();

    const grants = await tx.propertyAccessGrant.findMany({
      where: { organizationId: ctx.organizationId, propertyId },
      select: {
        id: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
        membership: { select: { id: true, user: { select: { fullName: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = Date.now();
    return grants.map((g) => ({
      id: g.id,
      membershipId: g.membership.id,
      manager: g.membership.user,
      expiresAt: g.expiresAt,
      createdAt: g.createdAt,
      state: g.revokedAt ? "REVOKED" : g.expiresAt && g.expiresAt.getTime() <= now ? "EXPIRED" : "ACTIVE",
    }));
  });

export async function revokeGrant(ctx: Ctx, actorUserId: string, grantId: string, ip?: string) {
  await withOrg(ctx.organizationId, async (tx) => {
    const result = await tx.propertyAccessGrant.updateMany({
      where: { id: grantId, organizationId: ctx.organizationId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count === 0) throw new AppError(404, "NOT_FOUND", "We couldn't find an active grant with that ID.");

    await tx.auditLog.create({
      data: { organizationId: ctx.organizationId, actorUserId, action: "grant.revoked", entity: "PropertyAccessGrant", entityId: grantId, ip },
    });
  });
}
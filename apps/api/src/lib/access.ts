import type { Prisma } from "../generated/prisma/client";
import type { Role } from "./roles";

export interface Ctx {
  organizationId: string;
  membershipId: string;
  role: Role;
}

// Used as `where: { ...propertyScope(ctx) }` in EVERY property query.
// The organization boundary is already enforced by RLS. This is the boundary INSIDE it.
export function propertyScope(ctx: Ctx): Prisma.PropertyWhereInput {
  switch (ctx.role) {
    case "OWNER":
      return {};
    case "MANAGER":
      return {
        grants: {
          some: {
            membershipId: ctx.membershipId,
            revokedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      };
    default:
      return { id: { in: [] } }; // TENANT / MAINTENANCE: nothing yet. Fail closed.
  }
}
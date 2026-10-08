import type { Prisma } from "../generated/prisma/client";
import { withSystem } from "./tenantDb";

// One place to write audit entries.
export const writeAudit = (data: Prisma.AuditLogUncheckedCreateInput) =>
  withSystem((tx) => tx.auditLog.create({ data }));
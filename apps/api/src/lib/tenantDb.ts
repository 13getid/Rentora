import type { Prisma } from "../generated/prisma/client";
import { prisma } from "./prisma";

export type Tx = Prisma.TransactionClient;

// Run `fn` as ONE organization. Every query inside is filtered by the database.
export async function withOrg<T>(organizationId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // The third argument `true` = local to this transaction. It vanishes at COMMIT/ROLLBACK,
    // so a pooled connection never carries one request's context into the next.
    await tx.$queryRaw`SELECT set_config('app.current_org', ${organizationId}, true)`;
    return fn(tx);
  });
}

// Cross-organization context. ONLY for identity code and background jobs.
export async function withSystem<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
    return fn(tx);
  });
}
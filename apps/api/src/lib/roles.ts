import type { Membership } from "../generated/prisma/client";

// "OWNER" | "MANAGER" | "TENANT" | "MAINTENANCE", taken straight from the Prisma schema,
// so the type can never drift away from the database.
export type Role = Membership["role"];
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env";
import { PrismaClient } from "../generated/prisma/client";

// The adapter is the "cable" between Prisma and PostgreSQL.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// One shared client for the whole app. It manages a pool of connections.
export const prisma = new PrismaClient({ adapter });
import { AppError } from "../../middleware/errorHandler";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../lib/password";
import type { SignupInput } from "./auth.schemas";

interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

// Postgres refused a duplicate value in a UNIQUE column. Prisma reports it as P2002.
const isUniqueViolation = (err: unknown) =>
  typeof err === "object" && err !== null && "code" in err && err.code === "P2002";

export async function signup(input: SignupInput, meta: RequestMeta) {
  const passwordHash = await hashPassword(input.password); // slow on purpose, so do it before the transaction

  try {
    return await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({ data: { name: input.organizationName } });

      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          fullName: input.fullName,
          phone: input.phone,
        },
      });

      // The role is decided HERE, by the server. The client never chooses it.
      await tx.membership.create({
        data: { userId: user.id, organizationId: organization.id, role: "OWNER" },
      });

      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          actorUserId: user.id,
          action: "auth.signup",
          entity: "User",
          entityId: user.id,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      });

      // Pick fields explicitly. Never return the whole user row (it holds passwordHash).
      return {
        user: { id: user.id, email: user.email, fullName: user.fullName },
        organization: { id: organization.id, name: organization.name },
      };
    });
  } catch (err) {
    // The database's UNIQUE rule is the judge. Checking "does this email exist?"
    // first and inserting after would be racy: two requests could pass the check together.
    if (isUniqueViolation(err)) {
      throw new AppError(409, "EMAIL_TAKEN", "An account with that email already exists. Try logging in instead.");
    }
    throw err;
  }
}
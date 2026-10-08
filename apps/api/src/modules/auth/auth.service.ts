import { env } from "../../config/env";
import { hashPassword, verifyPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";
import { generateRefreshToken, hashToken, signAccessToken } from "../../lib/tokens";
import { AppError } from "../../middleware/errorHandler";
import type { LoginInput, SignupInput } from "./auth.schemas";

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

const REFRESH_MS = env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;
const REUSE_GRACE_MS = 10_000; // two browser tabs can legitimately race each other

const isUniqueViolation = (err: unknown) =>
  typeof err === "object" && err !== null && "code" in err && err.code === "P2002";

// ---------------------------------------------------------------- signup
export async function signup(input: SignupInput, meta: RequestMeta) {
  const passwordHash = await hashPassword(input.password);

  try {
    return await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({ data: { name: input.organizationName } });
      const user = await tx.user.create({
        data: { email: input.email, passwordHash, fullName: input.fullName, phone: input.phone },
      });
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
      return {
        user: { id: user.id, email: user.email, fullName: user.fullName },
        organization: { id: organization.id, name: organization.name },
      };
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, "EMAIL_TAKEN", "An account with that email already exists. Try logging in instead.");
    }
    throw err;
  }
}

// ------------------------------------------------------- session helper
// One row in `sessions` = one logged-in device.
async function startSession(userId: string, meta: RequestMeta) {
  const refreshToken = generateRefreshToken();
  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hashToken(refreshToken), // store the hash only
      expiresAt: new Date(Date.now() + REFRESH_MS),
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  const accessToken = await signAccessToken({ userId, sessionId: session.id });
  return { accessToken, refreshToken };
}

// A real hash of a throwaway password, used when the email doesn't exist.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword("not-a-real-password"));

// ----------------------------------------------------------------- login
export async function login(input: LoginInput, meta: RequestMeta) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      memberships: {
        where: { status: "ACTIVE", organization: { status: "ACTIVE" } },
        include: { organization: true },
      },
    },
  });

  // ALWAYS run one password verification, even for unknown emails. Otherwise
  // "no such user" answers instantly and "wrong password" takes ~100ms, and an
  // attacker can measure that difference to discover registered emails.
  const passwordOk = await verifyPassword(user?.passwordHash ?? (await getDummyHash()), input.password);

  if (!user || !passwordOk) {
    await prisma.auditLog.create({
      data: { actorUserId: user?.id, action: "auth.login_failed", ip: meta.ip, userAgent: meta.userAgent },
    });
    // One message for both cases, on purpose.
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  const { accessToken, refreshToken } = await startSession(user.id, meta);

  await prisma.auditLog.create({
    data: {
      organizationId: user.memberships[0]?.organizationId,
      actorUserId: user.id,
      action: "auth.login",
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });

  return {
    accessToken,
    refreshToken, // the route moves this into a cookie and removes it from the JSON
    user: { id: user.id, email: user.email, fullName: user.fullName, isSystemAdmin: user.isSystemAdmin },
    memberships: user.memberships.map((m) => ({
      organizationId: m.organizationId,
      organizationName: m.organization.name,
      role: m.role,
    })),
  };
}

// --------------------------------------------------------------- refresh
export async function refresh(refreshToken: string | undefined, meta: RequestMeta) {
  const unauthorized = () => new AppError(401, "SESSION_EXPIRED", "Your session has ended. Please log in again.");

  if (!refreshToken) throw unauthorized();

  const session = await prisma.session.findUnique({ where: { refreshTokenHash: hashToken(refreshToken) } });
  if (!session) throw unauthorized();

  // "Claim" the token with ONE atomic statement: it only succeeds if the session
  // is still unused and unexpired. If two requests race, exactly one wins (count 1).
  const claimed = await prisma.session.updateMany({
    where: { id: session.id, revokedAt: null, expiresAt: { gt: new Date() } },
    data: { revokedAt: new Date() },
  });

  if (claimed.count === 0) {
    // This token was already used or revoked. Seconds ago: probably a tab race.
    // Long ago: someone is replaying an old token, so assume theft and end every session.
    const replayedLongAfter = session.revokedAt && Date.now() - session.revokedAt.getTime() > REUSE_GRACE_MS;
    if (replayedLongAfter) {
      await prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await prisma.auditLog.create({
        data: { actorUserId: session.userId, action: "auth.refresh_reuse_detected", ip: meta.ip, userAgent: meta.userAgent },
      });
    }
    throw unauthorized();
  }

  return startSession(session.userId, meta); // rotation: a brand-new refresh token
}

// ---------------------------------------------------------------- logout
export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;
  await prisma.session.updateMany({
    where: { refreshTokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
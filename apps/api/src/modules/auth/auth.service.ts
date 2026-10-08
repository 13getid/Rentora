import { env } from "../../config/env";
import { writeAudit } from "../../lib/audit";
import { hashPassword, verifyPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";
import { withSystem } from "../../lib/tenantDb";
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
    // System context: the organization doesn't exist yet, so there is no org to scope to.
    return await withSystem(async (tx) => {
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
async function startSession(userId: string, meta: RequestMeta) {
  const refreshToken = generateRefreshToken();
  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_MS),
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  const accessToken = await signAccessToken({ userId, sessionId: session.id });
  return { accessToken, refreshToken };
}

let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword("not-a-real-password"));

// ----------------------------------------------------------------- login
export async function login(input: LoginInput, meta: RequestMeta) {
  // System context: we are finding out WHICH organizations this person belongs to.
  const user = await withSystem((tx) =>
    tx.user.findUnique({
      where: { email: input.email },
      include: {
        memberships: {
          where: { status: "ACTIVE", organization: { status: "ACTIVE" } },
          include: { organization: true },
        },
      },
    }),
  );

  const passwordOk = await verifyPassword(user?.passwordHash ?? (await getDummyHash()), input.password);

  if (!user || !passwordOk) {
    await writeAudit({ actorUserId: user?.id, action: "auth.login_failed", ip: meta.ip, userAgent: meta.userAgent });
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  const { accessToken, refreshToken } = await startSession(user.id, meta);

  await writeAudit({
    organizationId: user.memberships[0]?.organizationId,
    actorUserId: user.id,
    action: "auth.login",
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return {
    accessToken,
    refreshToken,
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

  const claimed = await prisma.session.updateMany({
    where: { id: session.id, revokedAt: null, expiresAt: { gt: new Date() } },
    data: { revokedAt: new Date() },
  });

  if (claimed.count === 0) {
    const replayedLongAfter = session.revokedAt && Date.now() - session.revokedAt.getTime() > REUSE_GRACE_MS;
    if (replayedLongAfter) {
      await prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await writeAudit({
        actorUserId: session.userId,
        action: "auth.refresh_reuse_detected",
        ip: meta.ip,
        userAgent: meta.userAgent,
      });
    }
    throw unauthorized();
  }

  return startSession(session.userId, meta);
}

// ---------------------------------------------------------------- logout
export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;
  await prisma.session.updateMany({
    where: { refreshTokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
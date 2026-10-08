import { env } from "../../config/env";
import type { Ctx } from "../../lib/access";
import { isUniqueViolation } from "../../lib/dbErrors";
import { sendInvitationEmail } from "../../lib/mailer";
import { hashPassword } from "../../lib/password";
import { type Tx, withOrg, withSystem } from "../../lib/tenantDb";
import { generateOpaqueToken, hashToken } from "../../lib/tokens";
import { AppError } from "../../middleware/errorHandler";
import type { AcceptNewInput, InviteInput } from "./invitations.schemas";

const INVITE_DAYS = 7;
interface Meta { ip?: string; userAgent?: string }

// ------------------------------------------------ owner side (organization context)
export async function createInvitation(ctx: Ctx, actorUserId: string, input: InviteInput, ip?: string) {
  const token = generateOpaqueToken();

  const { invitation, organizationName } = await withOrg(ctx.organizationId, async (tx) => {
    const organization = await tx.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } });

    const alreadyMember = await tx.membership.findFirst({
      where: { organizationId: ctx.organizationId, user: { email: input.email } },
      select: { id: true },
    });
    if (alreadyMember) throw new AppError(409, "ALREADY_MEMBER", "That person already belongs to your organization.");

    // Re-inviting replaces earlier pending invitations, so only one link is ever valid.
    await tx.invitation.deleteMany({
      where: { organizationId: ctx.organizationId, email: input.email, acceptedAt: null },
    });

    const invitation = await tx.invitation.create({
      data: {
        organizationId: ctx.organizationId,
        email: input.email,
        role: input.role,
        tokenHash: hashToken(token), // only the hash is stored
        expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000),
      },
      select: { id: true, email: true, role: true, expiresAt: true },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organizationId,
        actorUserId,
        action: "invitation.created",
        entity: "Invitation",
        entityId: invitation.id,
        metadata: { email: input.email, role: input.role },
        ip,
      },
    });
    return { invitation, organizationName: organization.name };
  });

  const link = `${env.WEB_URL}/accept-invite?token=${token}`;
  await sendInvitationEmail({ to: invitation.email, organizationName, role: invitation.role, link });

  // Development only: return the token so we can test without an inbox.
  return env.NODE_ENV === "development" ? { invitation, devToken: token, devAcceptUrl: link } : { invitation };
}

export const listInvitations = (ctx: Ctx) =>
  withOrg(ctx.organizationId, (tx) =>
    tx.invitation.findMany({
      where: { organizationId: ctx.organizationId },
      select: { id: true, email: true, role: true, expiresAt: true, acceptedAt: true, createdAt: true }, // never tokenHash
      orderBy: { createdAt: "desc" },
    }),
  );

export async function revokeInvitation(ctx: Ctx, actorUserId: string, invitationId: string, ip?: string) {
  await withOrg(ctx.organizationId, async (tx) => {
    const result = await tx.invitation.deleteMany({
      where: { id: invitationId, organizationId: ctx.organizationId, acceptedAt: null },
    });
    if (result.count === 0) throw new AppError(404, "NOT_FOUND", "We couldn't find a pending invitation with that ID.");

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organizationId,
        actorUserId,
        action: "invitation.revoked",
        entity: "Invitation",
        entityId: invitationId,
        ip,
      },
    });
  });
}

// ------------------------------------------------ invitee side (system context)
// The organization is unknown until the token is resolved, so this runs as system.
async function claimInvitation(tx: Tx, token: string) {
  const invalid = () =>
    new AppError(
      400,
      "INVITATION_INVALID",
      "This invitation link is invalid or has expired. Ask the person who invited you to send a new one.",
    );

  const invitation = await tx.invitation.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!invitation) throw invalid();

  // One atomic statement: it only succeeds if the invitation is still unused AND unexpired.
  // If two requests race, exactly one gets count = 1.
  const claimed = await tx.invitation.updateMany({
    where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: new Date() } },
    data: { acceptedAt: new Date() },
  });
  if (claimed.count === 0) throw invalid();
  return invitation;
}

export async function acceptAsNewUser(input: AcceptNewInput, meta: Meta) {
  const passwordHash = await hashPassword(input.password);
  try {
    return await withSystem(async (tx) => {
      const invitation = await claimInvitation(tx, input.token);

      const user = await tx.user.create({
        data: {
          email: invitation.email, // the email comes from the INVITATION, never from the request
          passwordHash,
          fullName: input.fullName,
          phone: input.phone,
          emailVerifiedAt: new Date(), // the link reached their inbox, so the email is proven
        },
      });
      await tx.membership.create({
        data: { userId: user.id, organizationId: invitation.organizationId, role: invitation.role },
      });
      await tx.auditLog.create({
        data: {
          organizationId: invitation.organizationId,
          actorUserId: user.id,
          action: "invitation.accepted",
          entity: "Invitation",
          entityId: invitation.id,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      });
      return {
        user: { id: user.id, email: user.email, fullName: user.fullName },
        organizationId: invitation.organizationId,
        role: invitation.role,
      };
    });
  } catch (err) {
    // The transaction rolled back, so the invitation is NOT consumed.
    if (isUniqueViolation(err)) {
      throw new AppError(409, "ACCOUNT_EXISTS", "An account with this email already exists. Log in, then accept the invitation from your account.");
    }
    throw err;
  }
}

export async function acceptAsExistingUser(userId: string, token: string, meta: Meta) {
  try {
    return await withSystem(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const invitation = await claimInvitation(tx, token);

      // A wrong-account attempt throws here, and the transaction rolls the claim back.
      if (invitation.email !== user.email) {
        throw new AppError(403, "INVITATION_EMAIL_MISMATCH", "This invitation was sent to a different email address. Log in with that account.");
      }

      await tx.membership.create({
        data: { userId, organizationId: invitation.organizationId, role: invitation.role },
      });
      if (!user.emailVerifiedAt) {
        await tx.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
      }
      await tx.auditLog.create({
        data: {
          organizationId: invitation.organizationId,
          actorUserId: userId,
          action: "invitation.accepted",
          entity: "Invitation",
          entityId: invitation.id,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      });
      return { organizationId: invitation.organizationId, role: invitation.role };
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, "ALREADY_MEMBER", "You already belong to that organization.");
    }
    throw err;
  }
}
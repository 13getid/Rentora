import { createHash, randomBytes } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { env } from "../config/env";

const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export interface AccessClaims {
  userId: string;
  sessionId: string;
}

// The token carries ONLY who you are (sub) and which login session (sid).
// Roles are NOT inside it: we look them up on each request, so removing
// someone's access takes effect immediately instead of in 15 minutes.
export async function signAccessToken({ userId, sessionId }: AccessClaims) {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_TTL)
    .sign(secret);
}

// Returns the claims, or null for ANY problem (bad signature, expired, malformed).
export async function verifyAccessToken(token: string): Promise<AccessClaims | null> {
  try {
    // Pinning the algorithm blocks "alg: none" and algorithm-confusion attacks.
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.sid !== "string") return null;
    return { userId: payload.sub, sessionId: payload.sid };
  } catch {
    return null;
  }
}

// 32 random bytes from the operating system's secure generator.
export const generateRefreshToken = () => randomBytes(32).toString("base64url");

// One-way fingerprint. We store this, never the token itself.
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
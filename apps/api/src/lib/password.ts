import { hash, verify } from "@node-rs/argon2";

// Defaults are Argon2id, 19 MiB memory, 2 passes, which matches the OWASP minimum recommendation.
export const hashPassword = (plain: string) => hash(plain);

// Used by login in Step 3.5. A malformed stored hash must mean "no", never a crash.
export async function verifyPassword(hashed: string, plain: string) {
  try {
    return await verify(hashed, plain);
  } catch {
    return false;
  }
}
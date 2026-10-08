import { z } from "zod";

export const inviteSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    // OWNER is deliberately absent: nobody can mint owners by invitation.
    role: z.enum(["MANAGER", "TENANT", "MAINTENANCE"]),
  })
  .strict();

const token = z.string().min(20).max(200);

export const acceptNewSchema = z
  .object({
    token,
    fullName: z.string().trim().min(2, "Enter your full name.").max(100),
    password: z.string().min(10, "Use at least 10 characters.").max(128),
    phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, "Use digits only, like 0712345678.").optional(),
  })
  .strict();

export const acceptExistingSchema = z.object({ token }).strict();

export type InviteInput = z.infer<typeof inviteSchema>;
export type AcceptNewInput = z.infer<typeof acceptNewSchema>;
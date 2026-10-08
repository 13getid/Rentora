import { env } from "../config/env";

interface InvitationEmail {
  to: string;
  organizationName: string;
  role: string;
  link: string;
}

// DEV STUB: prints the email to the terminal.
// In Phase 11, replace the body with a real provider (Resend or SMTP). Callers don't change.
export async function sendInvitationEmail({ to, organizationName, role, link }: InvitationEmail) {
  if (env.NODE_ENV === "production") throw new Error("No email provider is configured yet.");
  console.log(`\n[email] To: ${to}\n  You've been invited to ${organizationName} as ${role}.\n  Accept: ${link}\n`);
}
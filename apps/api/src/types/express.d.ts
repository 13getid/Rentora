import type { Role } from "../lib/roles";

// "Declaration merging": we add our own fields to Express's Request type,
// so TypeScript knows that req.auth and req.ctx exist.
declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; sessionId: string; isSystemAdmin: boolean }; // set by authenticate
      ctx?: { organizationId: string; membershipId: string; role: Role }; // set by requireOrg
    }
  }
}

export {};
// Shared between the web app and (from Phase 3) the API.
// One definition of each enum means the two sides can never disagree.

export const ROLES = ["ADMIN", "OWNER", "MANAGER", "TENANT", "MAINTENANCE"] as const;
export type Role = (typeof ROLES)[number];

export const INVOICE_STATUSES = ["PAID", "PENDING", "PARTIAL", "OVERDUE"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

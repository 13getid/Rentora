// Postgres refused a duplicate in a UNIQUE column. Prisma reports it as P2002.
export const isUniqueViolation = (err: unknown) =>
  typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
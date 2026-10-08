import { z } from "zod";
import { AppError } from "../middleware/errorHandler";

const uuid = z.string().uuid();

// A malformed ID can't exist in our database, so it is simply "not found".
// This also stops invalid UUIDs from reaching Prisma, where they would cause a 500.
export function uuidParam(value: unknown): string {
  const parsed = uuid.safeParse(value);
  if (!parsed.success) throw new AppError(404, "NOT_FOUND", "We couldn't find what you asked for.");
  return parsed.data;
}
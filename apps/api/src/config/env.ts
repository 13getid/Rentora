import "dotenv/config";
import { z } from "zod";

// Describe what a valid environment looks like.
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsed = schema.safeParse(process.env);

// Fail fast: crash now with a clear message, not mysteriously later.
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;
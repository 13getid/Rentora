import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  // min(32): a short secret can be brute-forced, so we refuse to start with one
  JWT_ACCESS_SECRET: z.string().min(32, "Use a random secret of at least 32 characters."),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(7),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;
import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "./errorHandler";

// Returns a middleware that checks req.body against a Zod schema.
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // One entry per problem, so the web form can show the message under the right field.
      const details = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      throw new AppError(422, "VALIDATION_ERROR", "Some fields need attention. Fix them and try again.", details);
    }

    req.body = result.data; // replace the raw body with the cleaned version (trimmed, lowercased...)
    next();
  };
import type { ErrorRequestHandler, RequestHandler } from "express";

// A custom error we can throw anywhere:
// throw new AppError(409, "EMAIL_TAKEN", "That email is already registered.")
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown, // e.g. which form fields failed
  ) {
    super(message);
  }
}

// Runs only if no route matched.
export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}.` });
};

// Express recognizes an error handler by its FOUR parameters.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Errors raised by Express itself for bad requests (invalid JSON, body too large).
  // These are the client's mistake, so we answer 4xx rather than 500.
  if (typeof err?.status === "number" && err.status >= 400 && err.status < 500 && err.expose) {
    res.status(err.status).json({
      code: "BAD_REQUEST",
      message: "We couldn't read that request. Check that it is valid JSON and not too large.",
    });
    return;
  }

  console.error(err); // full detail goes to OUR logs only
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Something went wrong on our side. Try again, and contact support if it keeps happening.",
  });
};
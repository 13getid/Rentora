import type { ErrorRequestHandler, RequestHandler } from "express";

// A custom error we can throw anywhere: throw new AppError(404, "NOT_FOUND", "...")
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
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
    res.status(err.status).json({ code: err.code, message: err.message });
    return;
  }
  console.error(err); // full detail goes to OUR logs only
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Something went wrong on our side. Try again, and contact support if it keeps happening.",
  });
};
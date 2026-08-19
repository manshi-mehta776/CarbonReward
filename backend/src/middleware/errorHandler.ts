import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { logger } from "../config/logger.js";
import { Sentry } from "../config/sentry.js";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

// Centralized error handler: operational errors (AppError) return their own
// status + message; anything unexpected is logged, reported to Sentry, and
// masked from the client to avoid leaking internals.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  logger.error({ err, path: req.path }, "Unhandled error");
  Sentry.captureException(err);
  res.status(500).json({ success: false, message: "Internal server error" });
}

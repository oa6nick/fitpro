import type { Request, Response, NextFunction, RequestHandler } from "express";

/** Оборачивает async-хендлер, прокидывая ошибки в error-middleware. */
export function asyncH(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

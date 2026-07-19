import type { Request, Response, NextFunction } from "express";
import { AUTH_COOKIE, verifyToken, type JwtPayload, type Role } from "./jwt.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Токен сессии: httpOnly-cookie (веб) или Authorization: Bearer (нативные iOS/Android). */
export function tokenFromRequest(req: Request): string | undefined {
  const cookieToken = req.cookies?.[AUTH_COOKIE];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return undefined;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = tokenFromRequest(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }
  req.user = payload;
  next();
}

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Требуется авторизация" });
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Недостаточно прав" });
    }
    next();
  };
}

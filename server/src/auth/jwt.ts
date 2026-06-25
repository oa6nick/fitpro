import jwt from "jsonwebtoken";
import { env } from "../env.js";

export type Role = "trainer" | "client";

export interface JwtPayload {
  sub: string; // user id
  role: Role;
  name: string;
  email: string;
}

export const AUTH_COOKIE = "fitpro_token";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as any });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.cookieSecure, // true только при HTTPS; на HTTP-по-IP — false
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
};

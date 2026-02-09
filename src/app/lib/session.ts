import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { encrypt, decrypt } from "./encrypt";

const COOKIE_NAME = "x5p_session";
const TTL = 60 * 60 * 24; // 1 day

export function setSession(res: NextResponse, sessionObj: Record<string, any>, secret: string) {
  const val = JSON.stringify(sessionObj);
  const encrypted = encrypt(val, secret);
  res.cookies.set(COOKIE_NAME, encrypted, {
    path: "/",
    httpOnly: true,
    maxAge: TTL,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSession(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", { path: "/", httpOnly: true, maxAge: 0 });
}

export function getSession(req: NextRequest, secret: string) {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return null;
  try {
    const json = decrypt(cookie, secret);
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}

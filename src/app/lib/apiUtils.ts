// Centralized API utilities
import { NextRequest } from "next/server";

// Helper to extract cookies from NextRequest
export function getCookieHeader(req: NextRequest) {
  const cookie = req.headers.get('cookie');
  return cookie ? { cookie } : {};
}

// Helper to get absolute URL for internal API calls
export function getAbsoluteUrl(req: NextRequest, path: string) {
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}${path}`;
}
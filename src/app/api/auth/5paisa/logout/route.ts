import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "../../../../../lib/session";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true });
  clearSession(res);
  return res;
}

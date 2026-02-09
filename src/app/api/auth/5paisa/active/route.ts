import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../../lib/session";

export async function GET(req: NextRequest) {
  const secret = process.env.SESSION_SECRET!;
  const session = getSession(req, secret);
  if (!session) {
    return NextResponse.json({ active: false }, { status: 200 });
  }
  return NextResponse.json({ active: true, session }, { status: 200 });
}

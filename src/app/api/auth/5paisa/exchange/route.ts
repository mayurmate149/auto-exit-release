import { NextRequest, NextResponse } from "next/server";
import { setSession } from "../../../../../lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { requestToken } = body;

  if (!requestToken) return NextResponse.json({ error: "missing requestToken" }, { status: 400 });

  const payload = {
    head: { Key: process.env.FIVEPAISA_APP_KEY },
    body: {
      RequestToken: requestToken,
      EncryKey: process.env.FIVEPAISA_ENCRY_KEY,
      UserId: process.env.FIVEPAISA_USER_ID,
    },
  };

  const apiRes = await fetch("https://Openapi.5paisa.com/VendorsAPI/Service1.svc/GetAccessToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await apiRes.json();

  // If API returns success (Status===0 in body), store session
  const status = data?.body?.Status ?? data?.body?.status ?? null;
  if (status === 0 || status === undefined) {
    const accessToken = data?.body?.AccessToken ?? data?.body?.accessToken;
    const clientCode = data?.body?.ClientCode ?? data?.body?.clientCode;

    const res = NextResponse.json({ success: true });
    setSession(res, { accessToken, clientCode }, process.env.SESSION_SECRET!);
    return res;
  }

  return NextResponse.json({ success: false, data }, { status: 400 });
}

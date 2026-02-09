import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const vendorKey = process.env.FIVEPAISA_APP_KEY;
  if (!vendorKey) return NextResponse.json({ error: "VendorKey not configured" }, { status: 500 });

  const responseUrl = encodeURIComponent(process.env.NEXT_PUBLIC_CALLBACK_URL + "/callback");
  const loginUrl = `https://dev-openapi.5paisa.com/WebVendorLogin/VLogin/Index?VendorKey=${vendorKey}&ResponseURL=${responseUrl}`;

  // redirect client to 5paisa login
  return NextResponse.redirect(loginUrl);
}

import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "../../../../lib/encrypt";

const PLACE_ORDER_URL =
  "https://Openapi.5paisa.com/VendorsAPI/Service1.svc/V1/PlaceOrderRequest";

export async function POST(req: NextRequest) {
  /* ───────────── AUTH ───────────── */
  const cookie = req.cookies.get("x5p_session")?.value;
  if (!cookie) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let session: any;
  try {
    session = JSON.parse(decrypt(cookie, process.env.SESSION_SECRET!));
  } catch {
    return NextResponse.json({ error: "invalid_session" }, { status: 401 });
  }

  const { accessToken } = session;
  if (!accessToken) {
    return NextResponse.json({ error: "missing_access_token" }, { status: 401 });
  }

  /* ───────── FETCH POSITIONS ───────── */
  const posRes = await fetch(`${req.nextUrl.origin}/api/positions`, {
    headers: { Cookie: req.headers.get("cookie") || "" },
    cache: "no-store",
  });

  const posJson = await posRes.json();
  const positions = Array.isArray(posJson.positions)
    ? posJson.positions
    : [];

  /* ───── FILTER: OPTIONS ONLY (CE/PE) ───── */
  const optionPositions = positions.filter((p: any) => {
    const raw = p.raw || {};
    return (
      raw.ExchType === "D" &&
      typeof raw.ScripCode === "number" &&
      typeof raw.ScripName === "string" &&
      (
        raw.ScripName.includes(" CE ") ||
        raw.ScripName.includes(" PE ")
      ) &&
      Number(raw.NetQty) !== 0
    );
  });

  if (optionPositions.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No open option positions",
    });
  }

  /* ───────── PLACE EXIT ORDERS ───────── */
  const results: any[] = [];

  for (let i = 0; i < optionPositions.length; i++) {
    const p = optionPositions[i];
    const raw = p.raw;

    // 🔑 DERIVE FLAGS CORRECTLY
    const isIntraday = raw.OrderFor !== "D"; // D = Carry Forward
    const orderType = raw.NetQty < 0 ? "Buy" : "Sell"; // reverse to exit
    const qty = Math.abs(Number(raw.NetQty)); // exact lots only

    const payload = {
      head: {
        key: process.env.FIVEPAISA_APP_KEY,
      },
      body: {
        Exchange: raw.Exch || "N",
        ExchangeType: "D",
        ScripCode: Number(raw.ScripCode), // MUST be numeric
        OrderType: orderType,             // "Buy" or "Sell"
        Qty: qty,
        Price: 0,                         // Market exit
        IsIntraday: isIntraday,           // MUST match OrderFor
        iOrderValidity: 0,
        AHPlaced: "N",
        RemoteOrderID: `EXIT_OPT_${Date.now()}_${i}`,
      },
    };

    let text = "";
    let parsed: any;

    try {
      const res = await fetch(PLACE_ORDER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      text = await res.text();
      parsed = JSON.parse(text);
    } catch {
      parsed = { error: "NON_JSON_RESPONSE", raw: text };
    }

    results.push({
      scripCode: raw.ScripCode,
      scripName: raw.ScripName,
      exitedQty: qty,
      response: parsed,
    });
  }

  /* ───────── RESPONSE ───────── */
  return NextResponse.json({
    success: true,
    exitedCount: results.length,
    // Add body message to each result for UI display
    results: results.map(r => ({
      ...r,
      message: r.response?.body?.Message || ''
    })),
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "../../../lib/encrypt";
import { addLog } from "../../../lib/logStore";
// Use dynamic import for JSON in API route

const POSITIONS_URL = "https://Openapi.5paisa.com/VendorsAPI/Service1.svc/V3/NetPositionNetWise"; // as per SDK/docs

export async function GET(req: NextRequest) {

  // If DISPLAY_MOCK_DATA env flag is set, always return mock data
  if (process.env.DISPLAY_MOCK_DATA === 'true') {
    const { default: mockPositions } = await import('../../../mock/positions.json');
    return NextResponse.json({ success: true, positions: mockPositions });
  }

  const cookie = req.cookies.get("x5p_session")?.value;
  if (!cookie) {
    addLog("warn", "Positions: Not authenticated, returning mock positions", { endpoint: "positions" });
    const { default: mockPositions } = await import('../../../mock/positions.json');
    return NextResponse.json({ success: true, positions: mockPositions });
  }

  const secret = process.env.SESSION_SECRET!;
  let session;
  try {
    session = JSON.parse(decrypt(cookie, secret));
  } catch {
    addLog("warn", "Positions: Invalid session", { endpoint: "positions" });
    return NextResponse.json({ error: "invalid_session" }, { status: 401 });
  }

  const { accessToken, clientCode } = session;
  if (!accessToken || !clientCode) {
    addLog("warn", "Positions: Missing credentials", { endpoint: "positions" });
    return NextResponse.json({ error: "missing_credentials" }, { status: 401 });
  }

  const payload = {
    head: { key: process.env.FIVEPAISA_APP_KEY },
    body: { ClientCode: clientCode },
  };

  const apiRes = await fetch(POSITIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!apiRes.ok) {
    const txt = await apiRes.text();
    return NextResponse.json({ error: "positions_fetch_failed", details: txt }, { status: 502 });
  }

  const data = await apiRes.json();

  const positions = data?.body?.NetPositionDetail  ?? data?.body?.NetPositions ?? data?.body?.Positions ?? data?.body ?? null;
  if (!positions || !Array.isArray(positions)) {
    return NextResponse.json({ error: "no_positions_found", raw: data }, { status: 200 });
  }

  const optionsPositions = positions.filter((p: any) => {
    const isDeriv = (p.ExchType ?? p.ExchangeType ?? "").toString().toUpperCase() === "D";
    const sym = String(p.Symbol ?? p.ScripName ?? p.ScripData ?? "");
    const hasOpt = sym.includes("CE") || sym.includes("PE") || !!p.OptionType || !!p.CEPE;
    return isDeriv && hasOpt;
  });

  const mapped = optionsPositions.map((p: any) => {
    const netQty = Number(p.NetQty ?? p.NetQuantity ?? (p.BuyQty ?? 0) - (p.SellQty ?? 0));
    const avgPrice = Number(p.AvgRate ?? p.AveragePrice ?? p.BookedAvgPrice ?? 0);
    const ltp = Number(p.LTP ?? p.LastTradedPrice ?? p.LastPrice ?? 0);
    const symbolRaw = p.Symbol ?? p.ScripName ?? p.ScripData ?? "";

    // Try to extract Type, Expiry, Strike, and base symbol from ScripName if not present
    let optionType = p.OptionType ?? p.CEPE ?? "";
    let expiry = p.ExpiryDate ?? p.Expiry ?? "";
    let strike = p.StrikePrice ?? p.Strike ?? "";
    let symbol = symbolRaw;

    if ((!optionType || !expiry || !strike || !symbol) && symbolRaw) {
      // Example ScripName: "NIFTY 25 NOV 2025 CE 26450.00"
      const regex = /([A-Z]+)\s+(\d{2})\s+([A-Z]{3})\s+(\d{4})\s+(CE|PE)\s+(\d+(?:\.\d+)?)/i;
      const match = symbolRaw.match(regex);
      if (match) {
        // match[1] = base symbol, match[5] = Type, match[2] + match[3] + match[4] = Expiry, match[6] = Strike
        symbol = match[1];
        optionType = optionType || match[5];
        expiry = expiry || `${match[2]} ${match[3]} ${match[4]}`;
        let strikeRaw = match[6];
        if (strikeRaw.endsWith('.00')) strikeRaw = strikeRaw.slice(0, -3);
        strike = strike || strikeRaw;
      }
    }

    // Determine Buy/Sell type based on netQty
    const buySellType = netQty < 0 ? "Sell" : "Buy";
    const displayType = `${buySellType} - ${optionType}`;

    return {
      expiry,
      symbol,
      optionType: displayType,
      strike,
      netQty,
      avgPrice,
      ltp,
      unrealized: netQty * (ltp - avgPrice),
      raw: p,
    };
  });

  return NextResponse.json({ success: true, positions: mapped });
}


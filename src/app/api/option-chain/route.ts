import { NextRequest, NextResponse } from "next/server";
import * as greeks from "../../../../../lib/greeks";
import { addLog } from "../../../../../lib/logStore";

// Mock option chain data for demo (replace with real 5Paisa API when available)
const MOCK_OPTIONS_CHAIN = [
  { symbol: "NIFTY", strike: 24500, expiryDate: "25 FEB 2025", optionType: "CE", lastPrice: 150, bid: 148, ask: 152, openInterest: 125000, volume: 45000 },
  { symbol: "NIFTY", strike: 24500, expiryDate: "25 FEB 2025", optionType: "PE", lastPrice: 80, bid: 78, ask: 82, openInterest: 95000, volume: 32000 },
  { symbol: "NIFTY", strike: 24600, expiryDate: "25 FEB 2025", optionType: "CE", lastPrice: 95, bid: 93, ask: 97, openInterest: 110000, volume: 38000 },
  { symbol: "NIFTY", strike: 24600, expiryDate: "25 FEB 2025", optionType: "PE", lastPrice: 130, bid: 128, ask: 132, openInterest: 87000, volume: 28000 },
  { symbol: "NIFTY", strike: 24700, expiryDate: "25 FEB 2025", optionType: "CE", lastPrice: 55, bid: 54, ask: 56, openInterest: 95000, volume: 22000 },
  { symbol: "NIFTY", strike: 24700, expiryDate: "25 FEB 2025", optionType: "PE", lastPrice: 180, bid: 178, ask: 182, openInterest: 78000, volume: 18000 },
  { symbol: "NIFTY", strike: 24800, expiryDate: "25 FEB 2025", optionType: "CE", lastPrice: 30, bid: 29, ask: 31, openInterest: 80000, volume: 12000 },
  { symbol: "NIFTY", strike: 24800, expiryDate: "25 FEB 2025", optionType: "PE", lastPrice: 230, bid: 228, ask: 232, openInterest: 72000, volume: 10000 },
];

export async function GET(req: NextRequest) {
  try {
    const underlying = req.nextUrl.searchParams.get("underlying") || "NIFTY";
    const expiryDate = req.nextUrl.searchParams.get("expiryDate");
    const riskFreeRate = 0.06; // 6% annual
    const volatility = 0.25; // 25% implied volatility (can be made dynamic)
    const daysToExpiry = 10; // Example: 10 days to expiry
    const timeToExpiry = daysToExpiry / 365;

    // Mock current spot price (in real app, fetch from 5Paisa)
    const currentSpot = 24650;

    // Filter mock data
    let optionChain = MOCK_OPTIONS_CHAIN.filter(
      (opt) =>
        opt.symbol.toUpperCase() === underlying.toUpperCase() &&
        (!expiryDate || opt.expiryDate === expiryDate)
    );

    // Calculate Greeks for each option
    const chainWithGreeks = optionChain.map((option) => {
      const isCall = option.optionType === "CE";
      const greekValues = greeks.calculateAllGreeks(
        currentSpot,
        option.strike,
        timeToExpiry,
        riskFreeRate,
        volatility,
        isCall
      );

      // Calculate implied volatility
      const impliedVolatility = greeks.calculateImpliedVolatility(
        currentSpot,
        option.strike,
        timeToExpiry,
        riskFreeRate,
        option.lastPrice,
        isCall,
        volatility
      );

      return {
        ...option,
        currentSpot,
        daysToExpiry,
        greeks: {
          delta: parseFloat(greekValues.delta.toFixed(4)),
          gamma: parseFloat(greekValues.gamma.toFixed(6)),
          vega: parseFloat(greekValues.vega.toFixed(4)),
          theta: parseFloat(greekValues.theta.toFixed(4)),
          rho: parseFloat(greekValues.rho.toFixed(4)),
        },
        impliedVolatility: parseFloat(impliedVolatility.toFixed(4)),
      };
    });

    addLog("info", "Option chain fetched", {
      endpoint: "option-chain",
      underlying,
      count: chainWithGreeks.length,
    });

    return NextResponse.json({
      success: true,
      underlying,
      currentSpot,
      data: chainWithGreeks,
    });
  } catch (error: any) {
    addLog("error", "Option chain error", {
      endpoint: "option-chain",
      error: error.message,
    });
    return NextResponse.json(
      { error: "Failed to fetch option chain", details: error.message },
      { status: 500 }
    );
  }
}

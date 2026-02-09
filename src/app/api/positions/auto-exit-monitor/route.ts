import { NextResponse } from "next/server";
import { calculateTrailingStopLoss } from "../../../../lib/trailingSL";
import { connectToDatabase } from "../../../../lib/mongodb";
import type { NextRequest } from "next/server";
import { getAbsoluteUrl, getCookieHeader } from "../../../../lib/apiUtils";

// In-memory state (for demo; use Redis/db for production)
let autoExitState = {
  running: false,
  exited: false,
  mtm: null as number | null,
  trailingSL: null as number | null,
  cutReason: null as string | null,
  interval: null as NodeJS.Timeout | null,
  summary: null as any,
  logs: [] as string[],
};


// Helper to get headers as HeadersInit
function getHeaders(req: NextRequest): HeadersInit {
  const cookieHeader = getCookieHeader(req);
  // Only include cookie if present
  if (cookieHeader.cookie) {
    return { cookie: cookieHeader.cookie };
  }
  return {};
}

// Fetch positions with forwarded cookies
async function fetchPositions(req: NextRequest) {
  const url = getAbsoluteUrl(req, '/api/positions');
  const res = await fetch(url, {
    cache: "no-store",
    headers: getHeaders(req),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Fetch settings with forwarded cookies
async function fetchSettings(req: NextRequest) {
  const url = getAbsoluteUrl(req, '/api/settings');
  const res = await fetch(url, {
    cache: "no-store",
    headers: getHeaders(req),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Exit all with forwarded cookies
async function exitAll(req: NextRequest) {
  const url = getAbsoluteUrl(req, '/api/positions/auto-exit');
  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(req),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  const { action } = await req.json();
  if (action === "start") {
    if (autoExitState.running) {
      autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] Start requested but already running.`);
      console.log("[AutoExit] Start requested but already running.");
      return NextResponse.json({ success: false, error: "Already running" });
    }
    autoExitState.running = true;
    autoExitState.exited = false;
    autoExitState.cutReason = null;
    autoExitState.summary = null;
    autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] Auto-exit started.`);
    console.log("[AutoExit] Auto-exit started.");
    // Fetch settings for interval
    const settingsData = await fetchSettings(req);
    const pollInterval = Number(settingsData.settings?.schedulerFrequency) || 2000;
    const capital = Number(settingsData.settings?.totalCapital) || 0;
    // Trailing SL settings (all as numbers)
    const trailingSettings = {
      initialStopLossPct: Number(settingsData.settings?.initialStopLossPct) || 1,
      breakEvenTriggerPct: Number(settingsData.settings?.breakEvenTriggerPct) || 1,
      profitLockTriggerPct: Number(settingsData.settings?.profitLockTriggerPct) || 2,
      lockedProfitPct: Number(settingsData.settings?.lockedProfitPct) || 1,
      trailingStepPct: Number(settingsData.settings?.trailingStepPct) || 1,
      trailingGapPct: Number(settingsData.settings?.trailingGapPct) || 0.5,
    };
    let lastTrailingLevelPct: number | null = null;
    let previousStopLossPct: number = -trailingSettings.initialStopLossPct;
    let lastTrailing: number | null = null;
    let lastMTM: number | null = null;
    autoExitState.interval = setInterval(async () => {
      try {
        if (!autoExitState.running || autoExitState.exited) return;
        const d = await fetchPositions(req);
        const total = d.positions?.reduce((sum: number, p: any) => sum + (Number(p.unrealized) || 0), 0) ?? 0;
        autoExitState.mtm = total;
        // Calculate MTM as percent of capital
        const currentMtmPct = capital ? (total / capital) * 100 : 0;
        // Use trailing SL logic
        const result = calculateTrailingStopLoss(
          trailingSettings,
          currentMtmPct,
          lastTrailingLevelPct,
          previousStopLossPct
        );
        // Convert stopLossPct back to value
        const trailing = capital * (result.stopLossPct / 100);
        autoExitState.trailingSL = trailing;
        autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] MTM: ₹${total}, Trailing SL: ₹${trailing} (${result.stopLossPct.toFixed(2)}%)`);
        // Only update DB if values changed
        if (lastTrailing !== trailing || lastMTM !== total) {
          try {
            const { db } = await connectToDatabase();
            await db.collection('trailing_sl_status').updateOne(
              { _id: 'current' as any },
              {
                $set: {
                  trailingSL: trailing,
                  mtm: total,
                  trailingSLPct: result.stopLossPct,
                  mtmPct: currentMtmPct,
                  updatedAt: new Date(),
                  running: autoExitState.running,
                  exited: autoExitState.exited
                }
              },
              { upsert: true }
            );
            lastTrailing = trailing;
            lastMTM = total;
          } catch (err) {
            console.error('[AutoExit] Failed to save trailing SL to DB:', err);
          }
        }
        // Update trailing state for next tick
        lastTrailingLevelPct = result.lastTrailingLevelPct;
        previousStopLossPct = result.stopLossPct;
        if (result.shouldExit && !autoExitState.exited) {
          autoExitState.running = false;
          autoExitState.exited = true;
          autoExitState.cutReason = `MTM hit trailing stop loss (₹${trailing}). Trade auto-cut.`;
          autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] Auto-exit triggered. MTM hit trailing stop loss (₹${trailing}).`);
          console.log(`[AutoExit] Auto-exit triggered. MTM hit trailing stop loss (₹${trailing}).`);
          // Log to MongoDB
          try {
            const { db } = await connectToDatabase();
            await db.collection('activity_logs').insertOne({
              type: 'auto_exit',
              timestamp: new Date(),
              reason: autoExitState.cutReason,
              details: `MTM: ₹${total}, Trailing SL: ₹${trailing}`,
            });
          } catch (err) {
            console.error('[AutoExit] Failed to log auto exit to DB:', err);
          }
          clearInterval(autoExitState.interval!);
          autoExitState.interval = null;
          autoExitState.summary = await exitAll(req);
        }
      } catch (e) {
        autoExitState.running = false;
        autoExitState.cutReason = "Error in auto-exit monitoring.";
        autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] Error in auto-exit monitoring.`);
        console.log("[AutoExit] Error in auto-exit monitoring.");
        clearInterval(autoExitState.interval!);
        autoExitState.interval = null;
      }
    }, pollInterval);
    return NextResponse.json({ success: true });
  } else if (action === "stop") {
    if (autoExitState.interval) {
      clearInterval(autoExitState.interval);
      autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] Cleared backend polling interval.`);
      console.log("[AutoExit] Cleared backend polling interval.");
    } else {
      autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] Stop requested but no interval was running.`);
      console.log("[AutoExit] Stop requested but no interval was running.");
    }
    autoExitState.running = false;
    autoExitState.exited = false;
    autoExitState.cutReason = "Stopped by user.";
    autoExitState.interval = null;
    autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] Auto-exit stopped by user.`);
    console.log("[AutoExit] Auto-exit stopped by user.");
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: false, error: "Invalid action" });
}

export async function GET() {
  // Return current state
  return NextResponse.json({
    running: autoExitState.running,
    mtm: autoExitState.mtm,
    trailingSL: autoExitState.trailingSL,
    cutReason: autoExitState.cutReason,
    summary: autoExitState.summary,
    logs: autoExitState.logs.slice(-100),
  });
}

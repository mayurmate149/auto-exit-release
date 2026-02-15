import { NextResponse } from "next/server";
import { calculateTrailingStopLoss } from "../../../../lib/trailingSL";
import { addLog } from "../../../../lib/logStore";
import type { NextRequest } from "next/server";
import { getAbsoluteUrl, getCookieHeader } from "../../../../lib/apiUtils";
import {
  updateAutoExitSnapshot,
  getAutoExitSnapshot,
} from "../../../../context/AutoExitStore";

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
  // persistent tick state for scheduler-driven ticks
  lastTrailingLevelPct: null as number | null,
  previousStopLossPct: null as number | null,
  lastTrailing: null as number | null,
  lastMTM: null as number | null,
};
addLog("info", "Auto-exit-monitor: Initialized state", { endpoint: "auto-exit-monitor" });

const SCHEDULER_SECRET = process.env.SCHEDULER_SECRET || null;

function isValidSchedulerRequest(req: NextRequest) {
  if (!SCHEDULER_SECRET) return false;
  const header = req.headers.get('x-scheduler-secret') || req.headers.get('x-internal-secret');
  return !!header && header === SCHEDULER_SECRET;
}

function syncSnapshot(extra?: {
  trailingSLPct?: number | null;
  mtmPct?: number | null;
}) {
  updateAutoExitSnapshot({
    running: autoExitState.running,
    exited: autoExitState.exited,
    mtm: autoExitState.mtm,
    trailingSL: autoExitState.trailingSL,
    cutReason: autoExitState.cutReason,
    summary: autoExitState.summary,
    logs: autoExitState.logs.slice(-100),
    trailingSLPct: extra?.trailingSLPct ?? getAutoExitSnapshot().trailingSLPct,
    mtmPct: extra?.mtmPct ?? getAutoExitSnapshot().mtmPct,
  });
}


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

// Perform a single monitoring tick. Uses and updates module-level autoExitState so it can be
// invoked by an external scheduler (server cron, Vercel cron, GitHub Actions) via POST { action: 'tick' }
async function performTick(req: NextRequest) {
  try {
    if (!autoExitState.running || autoExitState.exited) return;
    const settingsData = await fetchSettings(req);
    const capital = Number(settingsData.settings?.totalCapital) || 0;
    const trailingSettings = {
      initialStopLossPct: Number(settingsData.settings?.initialStopLossPct) || 1,
      breakEvenTriggerPct: Number(settingsData.settings?.breakEvenTriggerPct) || 1,
      profitLockTriggerPct: Number(settingsData.settings?.profitLockTriggerPct) || 2,
      lockedProfitPct: Number(settingsData.settings?.lockedProfitPct) || 1,
      trailingStepPct: Number(settingsData.settings?.trailingStepPct) || 1,
      trailingGapPct: Number(settingsData.settings?.trailingGapPct) || 0.5,
    };

    const d = await fetchPositions(req);
    const total = d.positions?.reduce((sum: number, p: any) => sum + (Number(p.unrealized) || 0), 0) ?? 0;
    autoExitState.mtm = total;
    const currentMtmPct = capital ? (total / capital) * 100 : 0;

    const lastTrailingLevelPct = autoExitState.lastTrailingLevelPct;
    const previousStopLossPct = autoExitState.previousStopLossPct ?? -trailingSettings.initialStopLossPct;

    const result = calculateTrailingStopLoss(
      trailingSettings,
      currentMtmPct,
      lastTrailingLevelPct,
      previousStopLossPct
    );

    console.log("[AutoExit] Tick evaluated", { totalUnrealized: total, mtmPct: currentMtmPct, stopLossPct: result.stopLossPct, shouldExit: result.shouldExit });

    const trailing = capital * (result.stopLossPct / 100);
    autoExitState.trailingSL = trailing;
    autoExitState.lastTrailing = trailing;
    autoExitState.lastMTM = total;
    autoExitState.lastTrailingLevelPct = result.lastTrailingLevelPct;
    autoExitState.previousStopLossPct = result.stopLossPct;

    syncSnapshot({ trailingSLPct: result.stopLossPct, mtmPct: currentMtmPct });

    if (result.shouldExit && !autoExitState.exited) {
      autoExitState.running = false;
      autoExitState.exited = true;
      autoExitState.cutReason = `MTM hit trailing stop loss (₹${trailing}). Trade auto-cut.`;
      addLog("info", "Auto-exit-monitor: MTM hit trailing stop loss", {
        endpoint: "auto-exit-monitor",
        reason: autoExitState.cutReason,
        mtm: total,
        trailingSL: trailing,
      });
      if (autoExitState.interval) {
        clearInterval(autoExitState.interval);
        autoExitState.interval = null;
      }
      autoExitState.summary = await exitAll(req);
      syncSnapshot({ trailingSLPct: result.stopLossPct, mtmPct: currentMtmPct });
    }
  } catch (e) {
    autoExitState.running = false;
    autoExitState.cutReason = "Error in auto-exit monitoring.";
    autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] Error in auto-exit monitoring.`);
    addLog("error", "Auto-exit-monitor: Error in auto-exit monitoring", { endpoint: "auto-exit-monitor", error: e });
    if (autoExitState.interval) {
      clearInterval(autoExitState.interval);
      autoExitState.interval = null;
    }
    syncSnapshot();
  }
}

export async function POST(req: NextRequest) {
  const { action } = await req.json();
  // If this is a scheduler tick request, require the scheduler secret when configured
  if (action === 'tick' && SCHEDULER_SECRET && !isValidSchedulerRequest(req)) {
    addLog('warn', 'Auto-exit-monitor: Rejected tick - invalid scheduler secret', { endpoint: 'auto-exit-monitor' });
    return NextResponse.json({ success: false, error: 'Invalid scheduler secret' }, { status: 401 });
  }
  if (action === "start") {
    if (autoExitState.running) {
      autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] Start requested but already running.`);
      addLog("warn", "Auto-exit-monitor: Start requested but already running", { endpoint: "auto-exit-monitor" });
      syncSnapshot();
      return NextResponse.json({ success: false, error: "Already running" });
    }
    autoExitState.running = true;
    autoExitState.exited = false;
    autoExitState.cutReason = null;
    autoExitState.summary = null;
    autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] Auto-exit started.`);
    addLog("info", "Auto-exit-monitor: Auto-exit started", { endpoint: "auto-exit-monitor" });
    syncSnapshot({ trailingSLPct: null, mtmPct: null });
    const settingsData = await fetchSettings(req);
    const pollInterval = Number(settingsData.settings?.schedulerFrequency) || 2000;

    // Try to perform an immediate tick and then start a local interval when supported.
    try {
      await performTick(req);
      autoExitState.interval = setInterval(() => {
        void performTick(req);
      }, pollInterval);
    } catch (e) {
      addLog("info", "Auto-exit-monitor: Could not start local interval; expect external scheduler to call tick.", { endpoint: "auto-exit-monitor", error: e });
    }
    return NextResponse.json({ success: true });
  } else if (action === "tick") {
    // Single tick invocation for external schedulers (cron jobs, background workers)
    await performTick(req);
    return NextResponse.json({ success: true });
  } else if (action === "stop") {
    if (autoExitState.interval) {
      clearInterval(autoExitState.interval);
      autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] Cleared backend polling interval.`);
      addLog("info", "Auto-exit-monitor: Cleared backend polling interval", { endpoint: "auto-exit-monitor" });
    } else {
      autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] Stop requested but no interval was running.`);
      addLog("warn", "Auto-exit-monitor: Stop requested but no interval was running", { endpoint: "auto-exit-monitor" });
    }
    autoExitState.running = false;
    autoExitState.exited = false;
    autoExitState.cutReason = "Stopped by user.";
    autoExitState.interval = null;
    autoExitState.logs.push(`[${new Date().toLocaleTimeString()}] Auto-exit stopped by user.`);
    addLog("info", "Auto-exit-monitor: Auto-exit stopped by user", { endpoint: "auto-exit-monitor" });
    syncSnapshot();
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: false, error: "Invalid action" });
}

export async function GET() {
  // Return current state
  return NextResponse.json({
    ...getAutoExitSnapshot(),
  });
}

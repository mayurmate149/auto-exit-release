"use client";

import React, { useEffect, useState, useCallback } from "react";
import { showToast } from "./common/Toaster";
import MockMarketControls from "./MockMarketControls";

async function fetchTrailingSLStatus() {
  const res = await fetch("/api/positions/auto-exit-monitor", { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}


async function fetchPositions() {
  const res = await fetch("/api/positions", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function LiveButton({ live, setLive }: { live: boolean; setLive: (v: boolean) => void }) {
  const handleClick = async (newLive: boolean) => {
    setLive(newLive);
    try {
      await fetch('/api/activity-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: newLive ? 'live_on' : 'live_off', timestamp: new Date().toISOString() })
      });
    } catch { }
  };
  return (
    <>
      {!live && (
        <button
          className="px-4 py-2 rounded bg-gray-400 text-white font-semibold"
          onClick={() => handleClick(true)}
          type="button"
        >
          Live On
        </button>
      )}
      {live && (
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold"
          onClick={() => handleClick(false)}
          type="button"
        >
          Live Off
        </button>
      )}
    </>
  );
}

function ClearTrailingSLButton({ onClear, disabled }: { onClear: () => void; disabled: boolean }) {
  return (
    <button
      className={`ml-4 px-4 py-2 rounded font-semibold ${disabled ? 'bg-gray-400 text-white' : 'bg-purple-600 text-white'}`}
      onClick={onClear}
      disabled={disabled}
      type="button"
      data-testid="clear-trailing-sl-btn"
    >
      Clear Trailing SL
    </button>
  );
}


function AutoExitButtons({
  autoExitRunning,
  onStart,
  onStop,
}: {
  autoExitRunning: boolean;
  positionsLength: number;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <>
      {!autoExitRunning && (
        <button
          className="px-4 py-2 rounded bg-green-600 text-white"
          onClick={onStart}
          type="button"
        >
          Auto Exit Start
        </button>
      )}
      {autoExitRunning && (
        <button
          className="px-4 py-2 rounded bg-red-600 text-white"
          onClick={onStop}
          type="button"
        >
          Auto Exit Stop
        </button>
      )}
    </>
  );
}

function ExitAllButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      className={`ml-4 px-4 py-2 rounded font-semibold ${disabled ? 'bg-gray-400 text-white' : 'bg-orange-600 text-white'}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
      data-testid="exit-all-btn"
    >
      Exit All
    </button>
  );
}

function MTMDisplay({ mtm, totalUnrealized }: { mtm: number | null; totalUnrealized: number }) {
  return (
    <span className="ml-4 font-semibold">
      MTM: <span className={mtm !== null && mtm >= 0 ? 'text-success' : 'text-red-500'}>₹{mtm !== null ? mtm.toFixed(2) : totalUnrealized.toFixed(2)}</span>
    </span>
  );
}

function PositionsTable({ positions }: { positions: any[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      <div className="max-w-full overflow-x-auto">

        <table className="min-w-full border border-accent/30 rounded-lg">
          <thead className="bg-accent/10">
            <tr>
              <th className="px-4 py-2">Symbol</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Expiry</th>
              <th className="px-4 py-2">Strike</th>
              <th className="px-4 py-2">Net Qty</th>
              <th className="px-4 py-2">Avg Price</th>
              <th className="px-4 py-2">LTP</th>
              <th className="px-4 py-2">Unrealized P&L</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p: any, i: number) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2 font-semibold">{p.symbol}</td>
                <td className="px-4 py-2">{p.optionType}</td>
                <td className="px-4 py-2">{p.expiry}</td>
                <td className="px-4 py-2">{p.strike}</td>
                <td className="px-4 py-2">{p.netQty}</td>
                <td className="px-4 py-2">₹{p.avgPrice}</td>
                <td className="px-4 py-2">₹{p.ltp}</td>
                <td className={`px-4 py-2 font-bold ${p.unrealized >= 0 ? "text-success-500" : "text-red-500"}`}>₹{p.unrealized.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AutoExitResults({ autoExitResult }: { autoExitResult: any }) {
  if (!autoExitResult?.results) return null;
  return (
    <div className="mt-4">
      <h3 className="font-bold mb-2 text-md">Auto-Exit Results</h3>
      <table className="min-w-full border border-accent/30 rounded-lg mb-2">
        <thead className="bg-accent/10">
          <tr>
            <th className="px-4 py-2">Scrip Name</th>
            <th className="px-4 py-2">Exited Qty</th>
            <th className="px-4 py-2">Message</th>
          </tr>
        </thead>
        <tbody>
          {autoExitResult.results.map((r: any, i: number) => (
            <tr key={i} className="border-t">
              <td className="px-4 py-2 font-semibold">{r.scripName}</td>
              <td className="px-4 py-2">{r.exitedQty}</td>
              <td className="px-4 py-2">{r.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {autoExitResult.summaryMessage && (
        <div className="p-2 bg-yellow-100 text-yellow-800 rounded">{autoExitResult.summaryMessage}</div>
      )}
    </div>
  );
}

export default function OptionsPositionsWidget() {
  const [settings, setSettings] = useState<any>(null);
  const [trailingSLStatus, setTrailingSLStatus] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [mtm, setMtm] = useState<number | null>(null);
  const [cutReason, setCutReason] = useState<string | null>(null);
  const [autoExitResult, setAutoExitResult] = useState<any>(null);
  const [pollInterval, setPollInterval] = useState<number>(3000); // default 3s
  const [autoExitRunning, setAutoExitRunning] = useState(false);
  const [trailingStatus, setTrailingStatus] = useState<{
    running: boolean;
    mtm: number | null;
    trailingSL: number | null;
    cutReason: string | null;
    summary: any;
    logs: string[];
  } | null>(null);
  // Always start polling when autoExitRunning is true, even after refresh
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const fetchStatus = async () => {
      try {
        const status = await fetchTrailingSLStatus();
        setTrailingStatus(status);
        setTrailingSLStatus(status); // update both for consistency
        if (status && status.cutReason) {
          showToast(status.cutReason, { type: 'warning' });
        }
      } catch { }
    };
    if (autoExitRunning) {
      fetchStatus(); // initial fetch
      interval = setInterval(fetchStatus, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoExitRunning]);
  // Fetch live and autoExitRunning status from backend on mount
  useEffect(() => {
    fetch('/api/activity-log/status')
      .then(res => res.ok ? res.json() : null)
      .then(status => {
        if (status) {
          if (typeof status.live === 'boolean') setLive(status.live);
          if (typeof status.autoExitRunning === 'boolean') setAutoExitRunning(status.autoExitRunning);
        }
      })
      .catch(() => { });
  }, []);


  const handleClearTrailingSL = useCallback(async () => {
    try {
      const res = await fetch('/api/positions/trailing-sl-status/clear', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setTrailingSLStatus(null);
        showToast('Trailing Stop Loss cleared.', { type: 'success' });
      } else {
        showToast(result.error || 'Failed to clear Trailing SL.', { type: 'error' });
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to clear Trailing SL.', { type: 'error' });
    }
  }, []);

  // Handler for Exit All button
  const handleExitAll = useCallback(async () => {
    const res = await fetch('/api/positions/auto-exit', { method: 'POST' });
    const result = await res.json();
    setAutoExitResult(result);
    if (!res.ok || result.success === false) {
      const errorMsg = result.error || result.reason || 'Failed to exit positions.';
      showToast(errorMsg, { type: 'error' });
      setCutReason(errorMsg);
      return;
    }
    if (result.exited) {
      showToast(result.reason || 'Exited positions successfully.', { type: 'success' });
    } else if (result.reason) {
      showToast(result.reason, { type: 'info' });
    }
    if (result.reason) {
      setCutReason(result.reason);
    } else if (result.exitedCount || (result.results && result.results.length)) {
      const exitedCount = result.exitedCount ?? result.results.length;
      setCutReason(`Exit orders submitted for ${exitedCount} position${exitedCount === 1 ? '' : 's'}.`);
    } else {
      setCutReason('Exit orders submitted.');
    }
  }, []);

  // Fetch polling interval and settings from settings API on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.ok ? res.json() : null)
      .then(settingsRes => {
        if (settingsRes && settingsRes.settings) {
          setSettings(settingsRes.settings);
          if (settingsRes.settings.schedulerFrequency) {
            setPollInterval(settingsRes.settings.schedulerFrequency);
          }
        }
      })
      .catch(() => { });
    fetch('/api/positions/trailing-sl-status')
      .then(res => res.ok ? res.json() : null)
      .then(slRes => {
        if (slRes && slRes.status) {
          setTrailingSLStatus(slRes.status);
          if (typeof slRes.status.running === 'boolean') {
            setAutoExitRunning(slRes.status.running);
          }
        }
      })
      .catch(() => { });
  }, []);

  const effectiveCutReason = cutReason ?? trailingSLStatus?.cutReason ?? null;

  // Polling effect for Live mode
  useEffect(() => {
    if (!live) return;
    let mounted = true;
    let intervalId: NodeJS.Timeout;
    const poll = async () => {
      try {
        const d = await fetchPositions();
        if (!mounted) return;
        setData(d);
        setMtm(
          d.positions?.reduce((sum: number, p: any) => sum + (Number(p.unrealized) || 0), 0) ?? null
        );
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message);
      }
    };
    intervalId = setInterval(poll, pollInterval); // Use dynamic interval
    poll();
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [live, pollInterval]);

  // Initial fetch: use useEffect but only update state in async callback
  useEffect(() => {
    let mounted = true;
    fetchPositions()
      .then((d) => {
        if (!mounted) return;
        setData(d);
        setMtm(
          d.positions?.reduce((sum: number, p: any) => sum + (Number(p.unrealized) || 0), 0) ?? null
        );
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        let errorMsg = 'error';
        if (typeof err?.message === 'string' && err.message) {
          errorMsg = err.message;
        } else if (typeof err === 'string') {
          errorMsg = err;
        }
        setError(errorMsg);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);


  const handleAutoStart = useCallback(async () => {
    setCutReason(null);
    await fetch('/api/positions/auto-exit-monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' })
    });
    setAutoExitRunning(true);
    // Log auto exit start
    try {
      await fetch('/api/activity-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_exit_start', timestamp: new Date().toISOString() })
      });
    } catch { }
  }, []);

  const handleAutoStop = useCallback(async () => {
    await fetch('/api/positions/auto-exit-monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' })
    });
    setCutReason('Stopped by user.');
    setAutoExitRunning(false);
    // Log auto exit stop
    try {
      await fetch('/api/activity-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_exit_stop', timestamp: new Date().toISOString() })
      });
    } catch { }
  }, []);

  if (loading) {
    return (
      <div className="p-4 animate-pulse">Loading option positions...</div>
    );
  }
  if (error) {
    // Always show error message as 'Error: error' for test consistency
    return (
      <div className="p-4">
        <div className="text-red-500">
          {`Error: ${error}`}
        </div>
        <ExitAllButton onClick={handleExitAll} disabled={true} />
      </div>
    );
  }
  if (!data?.success || (data?.positions && data.positions.length === 0)) {
    // Always show empty state message for test consistency
    return (
      <div className="p-4">
        <div className="text-center">
          {"No option positions found for your account."}
        </div>
        <ExitAllButton onClick={handleExitAll} disabled={true} />
      </div>
    );
  }

  // Filter out positions with netQty 0
  const positions = (data.positions ?? []).filter((p: any) => Number(p.netQty) !== 0);
  const totalUnrealized = positions.reduce((sum: number, p: any) => sum + (Number(p.unrealized) || 0), 0);

  return (
    <div className="p-4">
      {process.env.DISPLAY_MOCK_DATA === 'true' && <MockMarketControls />}
      {/* Max Profit/Loss/SL Cards */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
        {settings && (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-white/3 flex items-center gap-4">
              <div className="h-10 w-10 flex items-center justify-center">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-green-600"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M8 12.5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Max Profit Amount</div>
                <div className="text-lg font-semibold text-green-700">₹{settings.maxProfitAmount ?? '--'}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-white/3 flex items-center gap-4">
              <div className="h-10 w-10 flex items-center justify-center">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-red-500"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M16 11.5l-2.5 2.5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Max Loss Amount</div>
                <div className="text-lg font-semibold text-red-600">₹{settings.maxLossAmount ?? '--'}</div>
              </div>
            </div>
          </>
        )}
        {trailingSLStatus && (
          <>
            {/* Active Stop Loss Card */}
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-white/3 flex items-center gap-4">
              <div className="h-10 w-10 flex items-center justify-center">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-blue-600"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M12 8v4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Active Stop Loss</div>
                <div className="text-lg font-semibold text-blue-700">
                  {(() => {
                    if (trailingSLStatus.mtm === undefined || trailingSLStatus.mtm === null) return '--';
                    const val = Math.round(trailingSLStatus.mtm);
                    return val > 0 ? `₹${val}` : `-₹${Math.abs(val)}`;
                  })()}
                </div>
              </div>
            </div>
            {/* Trailing Stop Loss Card */}
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-white/3 flex items-center gap-4">
              <div className="h-10 w-10 flex items-center justify-center">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-purple-600"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M12 16v-4l-2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Trailing Stop Loss</div>
                <div className="text-lg font-semibold text-purple-700">
                  {(() => {
                    if (trailingSLStatus.trailingSL === undefined || trailingSLStatus.trailingSL === null) return '--';
                    const val = Math.round(trailingSLStatus.trailingSL);
                    // If it's the first stop loss (negative), show with negative sign
                    return val < 0 ? `-₹${Math.abs(val)}` : `₹${val}`;
                  })()}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="col-span-12 flex justify-between" >
        <div className="mb-4 flex gap-4 items-center flex-wrap">
          <LiveButton live={live} setLive={setLive} />
          <AutoExitButtons
            autoExitRunning={autoExitRunning}
            positionsLength={positions.length}
            onStart={handleAutoStart}
            onStop={handleAutoStop}
          />
          <ExitAllButton onClick={handleExitAll} disabled={positions.length === 0} />
          <ClearTrailingSLButton onClear={handleClearTrailingSL} disabled={!trailingSLStatus} />
        </div>
        <div className="mb-4 text-md">
          Total Unrealized P&L: <span className={totalUnrealized >= 0 ? "text-success-600 font-semibold" : "text-red-500 font-semibold"}>₹{totalUnrealized.toFixed(2)}</span>
        </div>
      </div>

      {effectiveCutReason && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded">{effectiveCutReason}</div>
      )}
      {positions.length === 0 ? (
        <>
          <div className="py-6 ">No option positions found for your account.</div>
          <ExitAllButton onClick={handleExitAll} disabled={true} />
        </>
      ) : (
        <>
          <PositionsTable positions={positions} />
        </>
      )}
      <AutoExitResults autoExitResult={autoExitResult} />
    </div>
  );
}

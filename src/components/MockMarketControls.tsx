"use client";

import { useEffect, useRef, useState } from "react";
import { calcLtpForUnrealized } from "@/lib/calcLtpForUnrealized";
import { showToast } from "@/components/common/Toaster";

type Position = {
  unrealized?: number;
  netQty?: number;
  avgPrice?: number;
  raw?: Record<string, unknown>;
  [key: string]: any;
};

function clonePositions(data: unknown): Position[] {
  return Array.isArray(data) ? data.map((item) => ({ ...item })) : [];
}

function updateBackendPositions(updated: Position[]) {
  fetch("/api/mock/positions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated),
  }).catch(() => {
    /* no-op */
  });
}

export default function MockMarketControls() {
  const [moveAmount, setMoveAmount] = useState(500);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [autoDirection, setAutoDirection] = useState<"profit" | "loss">("profit");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("/api/mock/positions")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!mounted) return;
        const cloned = clonePositions(data);
        setPositions(cloned);
      })
      .catch(() => {
        if (!mounted) return;
        showToast("Failed to load mock positions", { type: "error" });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleMove = (direction: "profit" | "loss" | "neutral") => {
    setAutoDirection(direction === "loss" ? "loss" : "profit");
    setPositions((prev) => {
      const amt = Number(moveAmount) || 0;
      if (!amt) return prev;
      const updated = prev.map((pos, idx) => {
        if (idx !== 0) return pos;
        let newUnrealized = Number(pos.unrealized) || 0;
        if (direction === "profit") newUnrealized += amt;
        if (direction === "loss") newUnrealized -= amt;
        if (direction === "neutral") newUnrealized = 0;
        const rounded = Math.round(newUnrealized * 100) / 100;
        return {
          ...pos,
          unrealized: rounded,
          raw: {
            ...(pos.raw || {}),
            MTOM: rounded,
          },
        };
      });
      updateBackendPositions(updated);
      const totalUnrealized = updated.reduce(
        (sum, p) => sum + (Number(p.unrealized) || 0),
        0
      );
      fetch("/api/positions/auto-exit-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: autoUpdate, initialUnrealized: totalUnrealized }),
      }).catch(() => {
        /* no-op */
      });
      return updated;
    });
  };

  useEffect(() => {
    if (!autoUpdate) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(() => {
      setPositions((prev) => {
        const amt = Number(moveAmount) || 0;
        if (!amt) return prev;
        const updated = prev.map((pos) => {
          const netQty = Number(pos.netQty);
          const avgPrice = Number(pos.avgPrice);
          const prevUnrealized = Number(pos.unrealized) || 0;
          const targetUnrealized = autoDirection === "profit" ? prevUnrealized + amt : prevUnrealized - amt;
          const { ltp: newLtp, unrealized: newUnrealized } = calcLtpForUnrealized(
            avgPrice,
            netQty,
            targetUnrealized
          );
          return {
            ...pos,
            ltp: newLtp,
            unrealized: newUnrealized,
            raw: {
              ...(pos.raw || {}),
              LTP: newLtp,
              MTOM: newUnrealized,
            },
          };
        });
        updateBackendPositions(updated);
        return updated;
      });
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoUpdate, moveAmount, autoDirection]);

  const toggleAutoUpdate = () => {
    setAutoUpdate((prev) => !prev);
  };

  return (
    <div className="p-4 mb-4 border border-gray-200 rounded-2xl bg-white dark:bg-white/5 dark:border-white/10">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <span className="font-semibold text-gray-700 text-base mr-2">Mock Market Move:</span>
       <button
          type="button"
          onClick={toggleAutoUpdate}
          className={`px-4 py-2 font-semibold rounded-md text-white ${
            autoUpdate ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
          }`}
          disabled={loading}
        >
          {autoUpdate ? "Stop" : "Start"}
        </button>
        <button
          type="button"
          onClick={() => handleMove("profit")}
          className="px-4 py-2 font-semibold rounded-md bg-green-600 hover:bg-green-700 text-white"
          disabled={loading}
        >
          Profit Side
        </button>
        <button
          type="button"
          onClick={() => handleMove("loss")}
          className="px-4 py-2 font-semibold rounded-md bg-red-600 hover:bg-red-700 text-white"
          disabled={loading}
        >
          Loss Side
        </button>
        <button
          type="button"
          onClick={() => handleMove("neutral")}
          className="px-4 py-2 font-semibold rounded-md bg-gray-500 hover:bg-gray-600 text-white"
          disabled={loading}
        >
          Neutral
        </button>
        <label className="ml-2 font-medium text-gray-700 flex items-center gap-2">
          <span>Move Amount:</span>
          <input
            type="number"
            min="0"
            value={moveAmount}
            onChange={(e) => setMoveAmount(Number(e.target.value))}
            className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
          />
        </label>
      </div>
    </div>
  );
}

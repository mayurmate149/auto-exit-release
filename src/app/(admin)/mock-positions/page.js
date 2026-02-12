
"use client";

function getUpdatedPositions(positions, updater) {
  if (!Array.isArray(positions)) return [];
  return positions.map(updater);
}
import { calcLtpForUnrealized } from "@/lib/calcLtpForUnrealized";
import { useEffect, useState, useRef } from "react";


function MarketMoveControls({ moveAmount, setMoveAmount, onMove, autoUpdate, setAutoUpdate }) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mb-4">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <span className="font-semibold text-gray-700 text-base mr-2">Market Move:</span>
        <button
          type="button"
          onClick={() => onMove('profit')}
          className="px-4 py-2 font-bold text-base rounded-md shadow bg-green-600 hover:bg-green-700 text-white transition-colors border-0"
        >
          Profit Side
        </button>
        <button
          type="button"
          onClick={() => onMove('loss')}
          className="px-4 py-2 font-bold text-base rounded-md shadow bg-red-600 hover:bg-red-700 text-white transition-colors border-0"
        >
          Loss Side
        </button>
        <button
          type="button"
          onClick={() => onMove('neutral')}
          className="px-4 py-2 font-bold text-base rounded-md shadow bg-gray-400 hover:bg-gray-500 text-white transition-colors border-0"
        >
          Neutral
        </button>
        <label className="ml-4 font-medium text-gray-700 flex items-center gap-2">
          <span>Move Amount:</span>
          <input
            type="number"
            min="0"
            value={moveAmount}
            onChange={e => setMoveAmount(e.target.value)}
            className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
          />
        </label>
      </div>
      <div className="mb-4.5 flex items-center gap-4">
        <span className="font-semibold text-gray-700 text-base mr-2">Auto Update Prices (Simulate Real Market):</span>
        {autoUpdate ? (
          <button
            type="button"
            onClick={() => setAutoUpdate(false)}
            className="px-4 py-2 font-bold text-base rounded-md shadow-md bg-red-600 hover:bg-red-700 text-white transition-colors border-0"
          >
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setAutoUpdate(true)}
            className="px-4 py-2 font-bold text-base rounded-md shadow-md bg-green-600 hover:bg-green-700 text-white transition-colors border-0"
          >
            Start
          </button>
        )}
        <span className={`text-sm ml-2 ${autoUpdate ? 'text-green-700' : 'text-gray-500'}`}>{autoUpdate ? 'Running...' : 'Off'}</span>
      </div>
    </div>
  );
}

function PositionsEditor({ raw, onChange, loading, autoUpdate, onSave, success, error, positions }) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <p className="mb-4.5 text-gray-800 text-lg">
        Edit the JSON below to add, update, or delete mock positions. <br />
        <span className="text-blue-700 font-medium">Click <b>Save</b> to update the backend instantly.</span>
      </p>
      <div className="flex gap-8 flex-wrap">
        <div className="flex-1 min-w-85">
          <label className="font-semibold text-gray-700 text-base mb-1.5 block">
            Edit Positions JSON
          </label>
          <textarea
            value={raw}
            onChange={onChange}
            rows={18}
            className="w-full font-mono text-sm mb-2.5 p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 outline-none transition-colors min-h-85 resize-vertical disabled:bg-gray-200 disabled:cursor-not-allowed"
            disabled={loading || autoUpdate}
          />
          <div className="mb-2 min-h-7 flex items-center">
            <button
              onClick={onSave}
              disabled={loading || autoUpdate}
              className={`px-7 py-2.5 font-bold text-base rounded-md shadow-md transition-colors ${loading || autoUpdate ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800 cursor-pointer'} text-white border-0`}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            {success && <span className="text-green-700 ml-4.5 font-semibold">{success}</span>}
            {error && <span className="text-red-700 ml-4.5 font-semibold">{error}</span>}
          </div>
        </div>
        <div className="flex-1 min-w-85">
          <label className="font-semibold text-gray-700 text-base mb-1.5 block">
            Current Positions Preview
          </label>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm min-h-85 text-gray-800 overflow-x-auto border border-gray-200">
            {JSON.stringify(positions, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function MockPositionsPage() {
  const [moveAmount, setMoveAmount] = useState(500);
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [autoDirection, setAutoDirection] = useState('profit'); // 'profit' or 'loss'
  const intervalRef = useRef(null);

  // Helper: fetch positions from backend
  function fetchPositions() {
    setLoading(true);
    fetch("/api/mock/positions")
      .then((res) => res.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setPositions(arr);
        setRaw(JSON.stringify(arr, null, 2));
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load positions");
        setLoading(false);
      });
  }

  // Helper: update backend positions
  function updateBackendPositions(updated) {
    fetch("/api/mock/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  }

  // Handler to move market
  function handleMarketMove(direction) {
    setAutoDirection(direction);
    setPositions((prev) => {
      const amt = Number(moveAmount) || 500;
      // Only adjust the first position
      const updated = prev.map((pos, idx) => {
        if (idx === 0) {
          let newUnrealized = Number(pos.unrealized) || 0;
          if (direction === "profit") {
            newUnrealized += amt;
          } else if (direction === "loss") {
            newUnrealized -= amt;
          } else if (direction === "neutral") {
            newUnrealized = 0;
          }
          return {
            ...pos,
            unrealized: Math.round(newUnrealized * 100) / 100,
            raw: {
              ...pos.raw,
              MTOM: Math.round(newUnrealized * 100) / 100,
            },
          };
        }
        return pos;
      });
      setRaw(JSON.stringify(updated, null, 2));
      updateBackendPositions(updated);
      // Use new total unrealized for auto-exit
      let totalUnrealized = updated.reduce((sum, pos) => sum + (Number(pos.unrealized) || 0), 0);
      fetch('/api/positions/auto-exit-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: autoUpdate, initialUnrealized: totalUnrealized })
      });
      return updated;
    });
  }

  // Fetch positions on mount
  useEffect(() => {
    fetchPositions();
  }, []);

  // Auto-update simulation effect (uses moveAmount for direction)
  useEffect(() => {
    if (!autoUpdate) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(() => {
      setPositions((prev) => {
        const amt = Number(moveAmount) || 0;
        const updated = getUpdatedPositions(prev, (pos) => {
          const netQty = Number(pos.netQty);
          const avgPrice = Number(pos.avgPrice);
          const prevUnrealized = Number(pos.unrealized) || 0;
          const targetUnrealized = autoDirection === 'profit' ? prevUnrealized + amt : prevUnrealized - amt;
          const { ltp: newLtp, unrealized: newUnrealized } = calcLtpForUnrealized(avgPrice, netQty, targetUnrealized);
          return {
            ...pos,
            ltp: newLtp,
            unrealized: newUnrealized,
            raw: {
              ...pos.raw,
              LTP: newLtp,
              MTOM: newUnrealized,
            },
          };
        });
        setRaw(JSON.stringify(updated, null, 2));
        updateBackendPositions(updated);
        return updated;
      });
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoUpdate, moveAmount, autoDirection]);

  // Handle textarea change
  function handleChange(e) {
    setRaw(e.target.value);
    setError("");
    setSuccess("");
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [];
      const res = await fetch("/api/mock/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arr),
      });
      if (!res.ok) throw new Error("Failed to save");
      setPositions(arr);
      setSuccess("Saved successfully!");
    } catch (err) {
      setError("Invalid JSON or failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <MarketMoveControls
        moveAmount={moveAmount}
        setMoveAmount={setMoveAmount}
        onMove={handleMarketMove}
        autoUpdate={autoUpdate}
        setAutoUpdate={setAutoUpdate}
      />
      <PositionsEditor
        raw={raw}
        onChange={handleChange}
        loading={loading}
        autoUpdate={autoUpdate}
        onSave={handleSave}
        success={success}
        error={error}
        positions={positions}
      />
    </>
  );
}

"use client";

import React, { useEffect, useState } from "react";

interface GreeksData {
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

interface OptionData {
  symbol: string;
  strike: number;
  expiryDate: string;
  optionType: "CE" | "PE";
  lastPrice: number;
  bid: number;
  ask: number;
  openInterest: number;
  volume: number;
  currentSpot: number;
  daysToExpiry: number;
  greeks: GreeksData;
  impliedVolatility: number;
}

export default function OptionChainComponent() {
  const [underlying, setUnderlying] = useState("NIFTY");
  const [optionChain, setOptionChain] = useState<OptionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGreeks, setShowGreeks] = useState(false);
  const [selectedOption, setSelectedOption] = useState<OptionData | null>(null);

  const fetchOptionChain = async (symbol: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/option-chain?underlying=${symbol}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch option chain");
      const data = await res.json();
      setOptionChain(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptionChain(underlying);
  }, []);

  // Group options by strike price
  const groupedByStrike = optionChain.reduce(
    (acc, opt) => {
      const key = opt.strike;
      if (!acc[key]) acc[key] = { CE: null, PE: null };
      if (opt.optionType === "CE") acc[key].CE = opt;
      else acc[key].PE = opt;
      return acc;
    },
    {} as Record<number, { CE: OptionData | null; PE: OptionData | null }>
  );

  const sortedStrikes = Object.keys(groupedByStrike)
    .map(Number)
    .sort((a, b) => a - b);

  const currentSpot = optionChain[0]?.currentSpot || 0;

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
      <div className="mb-6 flex gap-4 items-center flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-2">Underlying</label>
          <input
            type="text"
            value={underlying}
            onChange={(e) => {
              setUnderlying(e.target.value.toUpperCase());
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") fetchOptionChain(underlying);
            }}
            className="px-3 py-2 border rounded bg-gray-100 dark:bg-gray-800 dark:border-gray-700"
            placeholder="e.g., NIFTY"
          />
        </div>
        <button
          onClick={() => fetchOptionChain(underlying)}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Fetch"}
        </button>
        <button
          onClick={() => setShowGreeks(!showGreeks)}
          className={`px-4 py-2 rounded ${
            showGreeks
              ? "bg-green-600 text-white"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          {showGreeks ? "Hide Greeks" : "Show Greeks"}
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">Error: {error}</div>}

      {selectedOption && (
        <OptionDetailsModal
          option={selectedOption}
          onClose={() => setSelectedOption(null)}
        />
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="border p-2 text-left">Call Option</th>
              <th className="border p-2">OI</th>
              <th className="border p-2">Vol</th>
              {showGreeks && (
                <>
                  <th className="border p-2 text-xs">Δ</th>
                  <th className="border p-2 text-xs">Γ</th>
                  <th className="border p-2 text-xs">Θ</th>
                  <th className="border p-2 text-xs">V</th>
                </>
              )}
              <th className="border p-2">Strike</th>
              {showGreeks && (
                <>
                  <th className="border p-2 text-xs">V</th>
                  <th className="border p-2 text-xs">Θ</th>
                  <th className="border p-2 text-xs">Γ</th>
                  <th className="border p-2 text-xs">Δ</th>
                </>
              )}
              <th className="border p-2">Vol</th>
              <th className="border p-2">OI</th>
              <th className="border p-2 text-left">Put Option</th>
            </tr>
          </thead>
          <tbody>
            {sortedStrikes.map((strike) => {
              const ce = groupedByStrike[strike].CE;
              const pe = groupedByStrike[strike].PE;
              const isCurrent = Math.abs(strike - currentSpot) < 50;

              return (
                <tr
                  key={strike}
                  className={`border ${
                    isCurrent
                      ? "bg-yellow-50 dark:bg-gray-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {/* Call Side */}
                  <td className="border p-2 text-sm">
                    {ce ? (
                      <button
                        onClick={() => setSelectedOption(ce)}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {ce.lastPrice.toFixed(2)}
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="border p-2 text-xs text-right">
                    {ce ? (ce.openInterest / 1000).toFixed(0) + "K" : "-"}
                  </td>
                  <td className="border p-2 text-xs text-right">
                    {ce ? ce.volume.toLocaleString() : "-"}
                  </td>
                  {showGreeks && ce && (
                    <>
                      <td className="border p-2 text-xs text-right text-green-600">
                        {ce.greeks.delta.toFixed(3)}
                      </td>
                      <td className="border p-2 text-xs text-right">
                        {ce.greeks.gamma.toFixed(5)}
                      </td>
                      <td className="border p-2 text-xs text-right text-red-600">
                        {ce.greeks.theta.toFixed(3)}
                      </td>
                      <td className="border p-2 text-xs text-right">
                        {ce.greeks.vega.toFixed(4)}
                      </td>
                    </>
                  )}
                  {!showGreeks && <td colSpan={4} />}

                  {/* Strike */}
                  <td className="border p-2 font-bold text-center">
                    {strike}
                  </td>

                  {/* Put Side */}
                  {showGreeks && pe && (
                    <>
                      <td className="border p-2 text-xs text-right">
                        {pe.greeks.vega.toFixed(4)}
                      </td>
                      <td className="border p-2 text-xs text-right text-red-600">
                        {pe.greeks.theta.toFixed(3)}
                      </td>
                      <td className="border p-2 text-xs text-right">
                        {pe.greeks.gamma.toFixed(5)}
                      </td>
                      <td className="border p-2 text-xs text-right text-green-600">
                        {pe.greeks.delta.toFixed(3)}
                      </td>
                    </>
                  )}
                  {!showGreeks && <td colSpan={4} />}

                  <td className="border p-2 text-xs text-right">
                    {pe ? pe.volume.toLocaleString() : "-"}
                  </td>
                  <td className="border p-2 text-xs text-right">
                    {pe ? (pe.openInterest / 1000).toFixed(0) + "K" : "-"}
                  </td>
                  <td className="border p-2 text-sm">
                    {pe ? (
                      <button
                        onClick={() => setSelectedOption(pe)}
                        className="text-red-600 dark:text-red-400 hover:underline"
                      >
                        {pe.lastPrice.toFixed(2)}
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>
          <strong>Spot Price:</strong> ₹{currentSpot.toFixed(2)}
        </p>
        <p className="mt-2 text-xs">
          Greeks Legend: Δ=Delta, Γ=Gamma, Θ=Theta (per day), V=Vega (per 1%
          vol)
        </p>
      </div>
    </div>
  );
}

/**
 * Modal to show detailed Greeks and analysis for a selected option
 */
function OptionDetailsModal({
  option,
  onClose,
}: {
  option: OptionData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {option.symbol} {option.strike} {option.optionType}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last Price
            </p>
            <p className="text-2xl font-bold">₹{option.lastPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Implied Vol
            </p>
            <p className="text-2xl font-bold">
              {(option.impliedVolatility * 100).toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <GreekCard label="Delta (Δ)" value={option.greeks.delta} />
          <GreekCard label="Gamma (Γ)" value={option.greeks.gamma} precision={5} />
          <GreekCard
            label="Theta (Θ) per day"
            value={option.greeks.theta}
            color="text-red-600"
          />
          <GreekCard label="Vega (V)" value={option.greeks.vega} />
          <GreekCard label="Rho (ρ)" value={option.greeks.rho} />
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Bid</p>
            <p className="font-semibold">₹{option.bid.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Ask</p>
            <p className="font-semibold">₹{option.ask.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Days to Expiry</p>
            <p className="font-semibold">{option.daysToExpiry}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Greek card component
 */
function GreekCard({
  label,
  value,
  precision = 4,
  color = "text-gray-900 dark:text-white",
}: {
  label: string;
  value: number;
  precision?: number;
  color?: string;
}) {
  return (
    <div className="border rounded p-3 bg-gray-50 dark:bg-gray-700">
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <p className={`text-sm font-bold ${color}`}>
        {value.toFixed(precision)}
      </p>
    </div>
  );
}
